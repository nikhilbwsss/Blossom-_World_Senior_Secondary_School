const express = require("express");
const router = express.Router();
const passport = require("passport");
const ExcelJS = require('exceljs');
const rateLimit = require('express-rate-limit');

// Models
const Admission = require('../models/Admission'); 
const ReAdmission = require('../models/ReAdmission');
const Admin = require("../models/Admin");
const Notice = require("../models/notice");
const FeeStructure = require("../models/FeeStructure");
const { admissionSchema, reAdmissionSchema } = require("../models/schema");

// Helpers & Middleware
const wrapAsync = require("../utils/wrapAsync");
const { cloudinary } = require('../cloudConfig'); 
const { uploadNotice, uploadStudent, isLoggedIn, saveRedirectUrl } = require("../middleware/middleware"); 

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: "Too many authentication attempts. Please try again later."
});

const ensureValidCsrf = (req, res, next) => {
    if (req.body && req.body.csrfToken && req.session && req.body.csrfToken === req.session.csrfToken) {
        return next();
    }
    req.flash("error", "Your session expired. Please try again.");
    return res.redirect("back");
};

const ensureSignupAllowed = wrapAsync(async (req, res, next) => {
    const adminCount = await Admin.countDocuments();
    const signupEnabled = process.env.ENABLE_ADMIN_SIGNUP === "true";

    if (adminCount === 0 || signupEnabled || req.isAuthenticated()) {
        return next();
    }

    req.flash("error", "Admin signup is disabled.");
    return res.redirect("/admin/login");
});

const pick = (source, allowedKeys) => {
    const result = {};
    allowedKeys.forEach((key) => {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
            result[key] = source[key];
        }
    });
    return result;
};

const admissionEditableFields = [
    "firstName", "middleName", "lastName", "aadhaarNumber", "apaarId", "requiredClass", "dob", "gender",
    "stream", "selectedSubjects", "bloodGroup", "identificationMark", "religion", "caste", "nationality",
    "fatherName", "fatherOccupation", "fatherIncome", "fatherEducation", "fatherAadhaar", "fatherWhatsApp",
    "motherName", "motherOccupation", "motherIncome", "motherEducation", "motherAadhaar", "motherContact",
    "motherWhatsApp", "mobile", "altMobile", "permanentAddress", "presentAddress", "localGuardianName",
    "siblingsInSchool", "isHandicapped", "handicapDetails", "height", "weight", "distanceFromSchool",
    "previousSchool", "previousSchoolDise", "previousSchoolPen", "previousSchoolResult",
    "previousSchoolAttendance", "previousSchoolClass", "previousSchoolAddress", "documentsSubmitted",
    "status", "adminNotes", "applicationPlace"
];

const readmissionEditableFields = [
    "className", "admissionDate", "classToBeAdmitted", "studentName", "previousMarksPercentage",
    "previousAttendancePercentage", "fatherName", "motherName", "parentWhatsapp", "studentAadhaar",
    "parentAadhaar", "height", "weight", "panNo", "parentQualification", "distanceFromSchool",
    "admissionNo", "permanentAddress"
];

const allowedAdmissionStatuses = new Set(["Pending", "Contacted", "Approved", "Rejected"]);
const toStr = (v) => (v == null ? "" : String(v));
const digitsOnly = (v) => toStr(v).replace(/\D+/g, "");
const sanitizeLooseNumber = (v) => toStr(v).replace(/[^0-9 .]/g, "");

const validateAdmissionUpdatePayload = (payload) => {
    const validationPayload = {
        ...payload,
        aadhaarNumber: payload.aadhaarNumber ? digitsOnly(payload.aadhaarNumber) : payload.aadhaarNumber,
        fatherAadhaar: payload.fatherAadhaar ? digitsOnly(payload.fatherAadhaar) : payload.fatherAadhaar,
        motherAadhaar: payload.motherAadhaar ? digitsOnly(payload.motherAadhaar) : payload.motherAadhaar,
        mobile: payload.mobile ? digitsOnly(payload.mobile) : payload.mobile,
        altMobile: payload.altMobile ? digitsOnly(payload.altMobile) : payload.altMobile,
        fatherWhatsApp: payload.fatherWhatsApp ? digitsOnly(payload.fatherWhatsApp) : payload.fatherWhatsApp,
        motherContact: payload.motherContact ? digitsOnly(payload.motherContact) : payload.motherContact,
        motherWhatsApp: payload.motherWhatsApp ? digitsOnly(payload.motherWhatsApp) : payload.motherWhatsApp,
        previousResult: payload.previousSchoolResult,
        prevAttendance: payload.previousSchoolAttendance,
        prevClass: payload.previousSchoolClass,
        prevPenNo: payload.previousSchoolPen,
        prevSchoolAddress: payload.previousSchoolAddress
    };

    return admissionSchema(validationPayload);
};

const validateReadmissionUpdatePayload = (payload) => {
    const validationPayload = {
        ...payload,
        parentWhatsapp: payload.parentWhatsapp ? sanitizeLooseNumber(payload.parentWhatsapp) : payload.parentWhatsapp,
        previousMarksPercentage: payload.previousMarksPercentage ? sanitizeLooseNumber(payload.previousMarksPercentage) : payload.previousMarksPercentage,
        previousAttendancePercentage: payload.previousAttendancePercentage ? sanitizeLooseNumber(payload.previousAttendancePercentage) : payload.previousAttendancePercentage,
        height: payload.height ? sanitizeLooseNumber(payload.height) : payload.height,
        weight: payload.weight ? sanitizeLooseNumber(payload.weight) : payload.weight,
        studentAadhaar: payload.studentAadhaar ? digitsOnly(payload.studentAadhaar) : payload.studentAadhaar,
        parentAadhaar: payload.parentAadhaar ? digitsOnly(payload.parentAadhaar) : payload.parentAadhaar
    };

    return reAdmissionSchema(validationPayload);
};

// --- 1. AUTHENTICATION ROUTES ---

router.get("/signup", ensureSignupAllowed, (req, res) => {
    res.render("admin/signup");
});

router.post("/signup", authLimiter, ensureValidCsrf, ensureSignupAllowed, wrapAsync(async (req, res, next) => {
    try {
        let { username, email, password, confirmPassword, secretCode } = req.body;
        if (secretCode !== process.env.ADMIN_SIGNUP_CODE) {
            req.flash("error", "Please enter valid code. Unauthorized access attempt.");
            return res.redirect("/admin/signup");
        }
        if (password !== confirmPassword) {
            req.flash("error", "Passwords do not match! Please check again.");
            return res.redirect("/admin/signup");
        }
        const newAdmin = new Admin({ email, username });
        const registeredAdmin = await Admin.register(newAdmin, password);
        req.login(registeredAdmin, (err) => {
            if (err) return next(err);
            req.flash("success", "Welcome! Admin account created successfully.");
            res.redirect("/admin/dashboard");
        });
    } catch (e) {
        req.flash("error", e.message);
        res.redirect("/admin/signup");
    }
}));

router.get("/login", (req, res) => {
    res.render("admin/login");
});

router.post("/login", 
    authLimiter,
    ensureValidCsrf,
    saveRedirectUrl, 
    passport.authenticate("local", {
        failureRedirect: "/admin/login",
        failureFlash: true,
    }), 
    (req, res) => {
        req.flash("success", "Welcome back to the TUIS Portal!");
        let redirectUrl = res.locals.redirectUrl || "/admin/dashboard";
        if (req.session && req.session.redirectUrl) delete req.session.redirectUrl;
        res.redirect(redirectUrl);
    }
);

router.post("/logout", isLoggedIn, ensureValidCsrf, (req, res, next) => {
    req.logout((err) => {
        if (err) return next(err);
        req.flash("success", "Logged out successfully!");
        res.redirect("/");
    });
});


router.get('/dashboard', isLoggedIn, wrapAsync(async (req, res) => {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const perPage = 10;
    const totalApplications = await Admission.countDocuments();
    const totalPages = Math.max(Math.ceil(totalApplications / perPage), 1);
    const currentPageNumber = Math.min(page, totalPages);

    const registrations = await Admission.find()
        .sort({ createdAt: -1 })
        .skip((currentPageNumber - 1) * perPage)
        .limit(perPage);

    const pendingCount = await Admission.countDocuments({ status: 'Pending' });
    const approvedCount = await Admission.countDocuments({ status: 'Approved' });
    const overdueCount = await Admission.countDocuments({
        'fees.dueDate': { $lt: new Date() },
        $expr: { $gt: ['$fees.totalAnnualFee', '$fees.amountPaid'] }
    });

    res.render('admin/dashboard', {
        registrations,
        pendingCount,
        approvedCount,
        overdueCount,
        totalApplications,
        totalPages,
        currentPageNumber,
        perPage,
        currentPage: 'dashboard'
    });
}));

router.get("/admissions", isLoggedIn, wrapAsync(async (req, res) => {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const perPage = 10;
    const totalApplications = await Admission.countDocuments();
    const totalPages = Math.max(Math.ceil(totalApplications / perPage), 1);
    const currentPageNumber = Math.min(page, totalPages);

    const registrations = await Admission.find()
        .sort({ createdAt: -1 })
        .skip((currentPageNumber - 1) * perPage)
        .limit(perPage);

    const pendingCount = await Admission.countDocuments({ status: 'Pending' });
    const approvedCount = await Admission.countDocuments({ status: 'Approved' });
    const overdueCount = await Admission.countDocuments({
        'fees.dueDate': { $lt: new Date() },
        $expr: { $gt: ['$fees.totalAnnualFee', '$fees.amountPaid'] }
    });

    res.render('admin/dashboard', {
        registrations,
        pendingCount,
        approvedCount,
        overdueCount,
        totalApplications,
        totalPages,
        currentPageNumber,
        perPage,
        currentPage: 'dashboard'
    });
})); 

router.get("/students", isLoggedIn, wrapAsync(async (req, res) => {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const perPage = 10;
    const totalStudents = await Admission.countDocuments();
    const totalPages = Math.max(Math.ceil(totalStudents / perPage), 1);
    const currentPageNumber = Math.min(page, totalPages);

    const students = await Admission.find()
        .sort({ createdAt: -1 })
        .skip((currentPageNumber - 1) * perPage)
        .limit(perPage);

    const pendingCount = await Admission.countDocuments({ status: 'Pending' });
    const approvedCount = await Admission.countDocuments({ status: 'Approved' });

    res.render("admin/students", {
        students,
        pendingCount,
        approvedCount,
        totalStudents,
        totalPages,
        currentPageNumber,
        perPage,
        currentPage: "students"
    });
}));

// Correct way to define the route
router.get("/admissions/:id/view", isLoggedIn, wrapAsync(async (req, res) => {
    const student = await Admission.findById(req.params.id);
    
    if (!student) {
        req.flash("error", "Student not found");
        return res.redirect("/admin/dashboard");
    }

    // ALL data must be in ONE single object {}
    res.render("admin/showAdmission", { 
        student: student, 
        currentPage: 'showAdmission' 
    });
}));

// --- RE-ADMISSION MANAGEMENT ---

// Re-admission list (used by the sidebar)
router.get("/readmissions", isLoggedIn, wrapAsync(async (req, res) => {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const perPage = 10;
    const totalReadmissions = await ReAdmission.countDocuments();
    const totalPages = Math.max(Math.ceil(totalReadmissions / perPage), 1);
    const currentPageNumber = Math.min(page, totalPages);

    const readmissions = await ReAdmission.find({})
        .sort({ createdAt: -1 })
        .skip((currentPageNumber - 1) * perPage)
        .limit(perPage);

    res.render("admin/readmissions", {
        readmissions,
        totalReadmissions,
        totalPages,
        currentPageNumber,
        perPage,
        currentPage: 'readmissions'
    });
}));


// View Re-admission form all datails fill in client side
router.get("/readmissions/:id/view", isLoggedIn, wrapAsync(async (req, res) => {
    const student = await ReAdmission.findById(req.params.id);
    if (!student) {
        req.flash("error", "Re-admission record not found");
        return res.redirect("/admin/readmissions");
    }
    res.render("admin/showReadmission", {
        student,
        currentPage: 'readmissions'
    });
}));

// Re-admission form edit 
router.get("/readmissions/:id/edit", isLoggedIn, wrapAsync(async (req, res) => {
    const student = await ReAdmission.findById(req.params.id);
    if (!student) {
        req.flash("error", "Re-admission record not found");
        return res.redirect("/admin/readmissions");
    }
    res.render("admin/editReadmission", {
        student,
        currentPage: 'readmissions'
    });
}));

// Re-admission form update (PUT)
router.put("/readmissions/:id", isLoggedIn, ensureValidCsrf, wrapAsync(async (req, res) => {
    const { id } = req.params;
    const existingRecord = await ReAdmission.findById(id);
    if (!existingRecord) {
        req.flash("error", "Re-admission record not found");
        return res.redirect("/admin/readmissions");
    }
    const safeUpdate = pick(req.body.data || {}, readmissionEditableFields);
    const mergedPayload = { ...existingRecord.toObject(), ...safeUpdate };
    const { error } = validateReadmissionUpdatePayload(mergedPayload);
    if (error) {
        req.flash("error", error.details.map((detail) => detail.message).join(", "));
        return res.redirect(`/admin/readmissions/${id}/edit`);
    }
    await ReAdmission.findByIdAndUpdate(id, safeUpdate, { runValidators: true });
    
    req.flash("success", "Re-admission details updated successfully!");
    res.redirect(`/admin/readmissions/${id}/view`);
}));

//Re-admission Delete
router.delete("/readmissions/:id", isLoggedIn, ensureValidCsrf, wrapAsync(async (req, res) => {
    const { id } = req.params;
    const record = await ReAdmission.findById(id);
    if (!record) {
        req.flash("error", "Re-admission record not found");
        return res.redirect("/admin/readmissions");
    }

    try {
        const photoPublicId = record.studentPhoto && record.studentPhoto.filename;
        if (photoPublicId) {
            await cloudinary.uploader.destroy(photoPublicId, { resource_type: "image" });
        }
    } catch (err) {
        console.error("Cloudinary photo delete failed:", err);
    }

    try {
        const sigPublicId = record.studentSignature && record.studentSignature.filename;
        if (sigPublicId) {
            await cloudinary.uploader.destroy(sigPublicId, { resource_type: "image" });
        }
    } catch (err) {
        console.error("Cloudinary signature delete failed:", err);
    }

    await ReAdmission.findByIdAndDelete(id);
    req.flash("success", "Re-admission record deleted successfully.");
    res.redirect("/admin/readmissions");
}));

// POST: Update Application Status (Approved/Rejected/Pending)
router.post("/admissions/:id/status", isLoggedIn, ensureValidCsrf, wrapAsync(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!allowedAdmissionStatuses.has(status)) {
        req.flash("error", "Invalid application status.");
        return res.redirect(`/admin/admissions/${id}/view`);
    }

    await Admission.findByIdAndUpdate(id, { status });
    req.flash("success", `Application status updated to ${status}`);
    res.redirect(`/admin/admissions/${id}/view`);
}));

// // UPDATE SUBMISSION
router.post('/update/:id', isLoggedIn, ensureValidCsrf, wrapAsync(async (req, res) => {
    const { id } = req.params;
    const existingAdmission = await Admission.findById(id);
    if (!existingAdmission) {
        req.flash("error", "Application not found!");
        return res.redirect("/admin/dashboard");
    }

    // Normalize checkbox inputs which can arrive as a string when only one item is checked.
    if (req.body.documentsSubmitted && !Array.isArray(req.body.documentsSubmitted)) {
        req.body.documentsSubmitted = [req.body.documentsSubmitted];
    }
    if (req.body.selectedSubjects && !Array.isArray(req.body.selectedSubjects)) {
        req.body.selectedSubjects = [req.body.selectedSubjects];
    }
    if (req.body.selectedSubjectsText && !req.body.selectedSubjects) {
        req.body.selectedSubjects = String(req.body.selectedSubjectsText)
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
    }
    delete req.body.selectedSubjectsText;

    const safeUpdate = pick(req.body, admissionEditableFields);
    const mergedPayload = { ...existingAdmission.toObject(), ...safeUpdate };
    const { error } = validateAdmissionUpdatePayload(mergedPayload);
    if (error) {
        req.flash("error", error.details.map((detail) => detail.message).join(", "));
        return res.redirect(`/admin/edit/${id}`);
    }
    await Admission.findByIdAndUpdate(id, safeUpdate, { runValidators: true });
    req.flash("success", "Application updated successfully!");
    res.redirect('/admin/dashboard');
}));


router.get("/edit/:id", isLoggedIn, wrapAsync(async (req, res) => {
    const student = await Admission.findById(req.params.id);
    if (!student) {
        req.flash("error", "Application not found!");
        return res.redirect("/admin/dashboard");
    }
    res.render("admin/edit", { student, currentPage: "edit" });
}));


// DELETE SUBMISSION
// Change .post to .delete to match your ?_method=DELETE
router.delete('/delete/:id', isLoggedIn, ensureValidCsrf, wrapAsync(async (req, res) => {
    const admission = await Admission.findById(req.params.id);
    if (!admission) {
        req.flash("error", "Application not found!");
        return res.redirect('/admin/dashboard');
    }

    // Best-effort Cloudinary cleanup: `studentPhoto.filename` is the Cloudinary public_id.
    try {
        const publicId = admission.studentPhoto && admission.studentPhoto.filename;
        if (publicId) {
            await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
        }
    } catch (err) {
        // Don't block deletion if Cloudinary cleanup fails.
        console.error("Cloudinary image delete failed:", err);
        req.flash("error", "Application deleted, but image cleanup failed.");
    }

    await Admission.findByIdAndDelete(req.params.id);
    req.flash("success", "Application deleted successfully.");
    res.redirect('/admin/dashboard');
}));

router.get("/export-excel", isLoggedIn, wrapAsync(async (req, res) => {
    const registrations = await Admission.find().sort({ submittedAt: -1 });
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Blossom_World_Admissions');

    // Updated Columns for the new form structure
    worksheet.columns = [
        { header: 'App ID', key: 'id', width: 25 },
        { header: 'Student Name', key: 'name', width: 30 },
        { header: 'Class', key: 'class', width: 15 },
        { header: 'Stream', key: 'stream', width: 15 },
        { header: 'Father Name', key: 'father', width: 25 },
        { header: 'Mother Name', key: 'mother', width: 25 },
        { header: 'Mobile', key: 'mobile', width: 20 },
        { header: 'Aadhaar (Student)', key: 'aadhaar', width: 20 },
        { header: 'APAAR ID', key: 'apaar', width: 20 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Applied Date', key: 'date', width: 20 },
    ];

    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF001F3F' } };

    registrations.forEach(reg => {
        worksheet.addRow({
            id: reg._id.toString(),
            name: `${reg.firstName} ${reg.lastName}`,
            class: reg.requiredClass,
            stream: reg.stream || 'N/A',
            father: reg.fatherName,
            mother: reg.motherName,
            mobile: reg.mobile,
            aadhaar: reg.aadhaarNumber || 'N/A',
            apaar: reg.apaarId || 'N/A',
            status: reg.status,
            date: reg.submittedAt ? reg.submittedAt.toLocaleDateString('en-GB') : 'N/A'
        });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=BlossomWorld_Admissions_2026.xlsx');
    await workbook.xlsx.write(res);
    res.end();
}));

router.get('/print-slip/:id', isLoggedIn, wrapAsync(async (req, res) => {
    const registration = await Admission.findById(req.params.id);
    if (!registration) {
        req.flash("error", "Application not found!");
        return res.redirect("/admin/dashboard");
    }
    res.render('admin/printSlip', { registration });
}));

// --- 3. FEE SETTINGS & SYNC ---

router.get("/fee-settings", isLoggedIn, wrapAsync(async (req, res) => {
    const currentFees = await FeeStructure.find({});
    res.render("admin/fee-settings", { 
        currentFees, 
        currentPage: 'fee-settings'
    });
}));

router.post("/fee-settings/update", isLoggedIn, ensureValidCsrf, wrapAsync(async (req, res) => {
    const { fees } = req.body; 
    for (let className in fees) {
        await FeeStructure.findOneAndUpdate(
            { className: className },
            { 
                monthlyFee: fees[className].monthly,
                admissionFee: fees[className].annual 
            },
            { upsert: true, new: true }
        );
    }
    req.flash("success", "Fee structure updated for the entire school!");
    res.redirect("/admin/fee-settings");
}));

router.post("/fee-settings/sync", isLoggedIn, ensureValidCsrf, wrapAsync(async (req, res) => {
    const structures = await FeeStructure.find({});
    for (let structure of structures) {
        await Admission.updateMany(
            { requiredClass: structure.className },
            { "fees.totalAnnualFee": (structure.monthlyFee * 12) + structure.admissionFee }
        );
    }
    req.flash("success", "All student accounts have been synced!");
    res.redirect("/admin/fee-settings");
}));

// --- 4. NOTICE MANAGEMENT (CORE MODULE) ---

// GET: Show Notice List
router.get("/notices", isLoggedIn, wrapAsync(async (req, res) => {
    // Sort: Pinned items first, then by newest date
    const allNotices = await Notice.find({}).sort({ isPinned: -1, createdAt: -1 });
    res.render("admin/manage-notices", { 
        allNotices, 
        title: "Manage Notices",
        currentPage: 'notices'
    });
}));

// GET: Show "Add Notice" Form
router.get("/notices/new", isLoggedIn, (req, res) => {
    res.render("admin/add-notice", { 
        title: "Post New Notice",
        currentPage: 'notices' 
    });
});

// POST: Save New Notice
router.post("/notices/add", isLoggedIn, ensureValidCsrf, uploadNotice.single('noticePdf'), wrapAsync(async (req, res) => {
    const { title, category, description, isPinned } = req.body;
    const pdfUrl = req.file ? req.file.path : null;

    const newNotice = new Notice({
        title,
        category,
        description,
        pdfUrl,
        isPinned: isPinned === 'on' // Checkbox logic
    });

    await newNotice.save();
    req.flash("success", "Notice published successfully!");
    res.redirect("/admin/notices"); 
}));

// POST: Toggle Pin Status
router.post("/notices/:id/toggle-pin", isLoggedIn, ensureValidCsrf, wrapAsync(async (req, res) => {
    const notice = await Notice.findById(req.params.id);
    if (!notice) {
        req.flash("error", "Notice not found.");
        return res.redirect("/admin/dashboard");
    }
    notice.isPinned = !notice.isPinned;
    await notice.save();
    req.flash("success", `Notice ${notice.isPinned ? "Pinned" : "Unpinned"} successfully!`);
    res.redirect("/admin/notices");
}));




// DELETE: Remove Notice & Cloudinary File
router.delete("/notices/:id", isLoggedIn, ensureValidCsrf, wrapAsync(async (req, res) => {
    const notice = await Notice.findById(req.params.id);
    if (!notice) return res.redirect("/admin/notices");

    if (notice.pdfUrl) {
        // Extract public_id from Cloudinary URL
        const filePart = notice.pdfUrl.split('/').pop().split('.')[0];
        const publicId = `school/notice/${filePart}`; 
        await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
    }

    await Notice.findByIdAndDelete(req.params.id);
    req.flash("success", "Notice and file deleted successfully.");
    res.redirect("/admin/notices");
}));

module.exports = router;




