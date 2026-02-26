const express = require("express");
const router = express.Router();
const passport = require("passport");
const ExcelJS = require('exceljs');
const methodOverride = require('method-override');

// Models
const Admission = require('../models/Admission'); 
const ReAdmission = require('../models/ReAdmission');
const Admin = require("../models/Admin");
const Notice = require("../models/notice");
const FeeStructure = require("../models/FeeStructure");

// Helpers & Middleware
const wrapAsync = require("../utils/wrapAsync");
const { cloudinary } = require('../cloudConfig'); 
const { uploadNotice, uploadStudent, isLoggedIn, saveRedirectUrl } = require("../middleware/middleware"); 

// --- 1. AUTHENTICATION ROUTES ---

router.get("/signup", (req, res) => {
    res.render("admin/signup");
});

router.post("/signup", wrapAsync(async (req, res, next) => {
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

router.get("/logout", (req, res, next) => {
    req.logout((err) => {
        if (err) return next(err);
        req.flash("success", "Logged out successfully!");
        res.redirect("/");
    });
});


router.get('/dashboard', isLoggedIn, wrapAsync(async (req, res) => {
    const registrations = await Admission.find().sort({ createdAt: -1 });
    const pendingCount = registrations.filter(r => r.status === 'Pending').length;

    res.render('admin/dashboard', {
        registrations,
        pendingCount,
        currentPage: 'dashboard'
    });
}));

router.get("/admissions", isLoggedIn, wrapAsync(async (req, res) => {
    const registrations = await Admission.find().sort({ createdAt: -1 });
    const pendingCount = registrations.filter(r => r.status === 'Pending').length;

    res.render('admin/dashboard', {
        registrations,
        pendingCount,
        currentPage: 'dashboard'
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
    const readmissions = await ReAdmission.find({}).sort({ createdAt: -1 });
    res.render("admin/readmissions", {
        readmissions,
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
router.put("/readmissions/:id", isLoggedIn, wrapAsync(async (req, res) => {
    const { id } = req.params
    await ReAdmission.findByIdAndUpdate(id, { ...req.body.data });
    
    req.flash("success", "Re-admission details updated successfully!");
    res.redirect(`/admin/readmissions/${id}/view`);
}));

//Re-admission Delete
router.delete("/readmissions/:id", isLoggedIn, wrapAsync(async (req, res) => {
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
router.post("/admissions/:id/status", isLoggedIn, wrapAsync(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    
    await Admission.findByIdAndUpdate(id, { status });
    req.flash("success", `Application status updated to ${status}`);
    res.redirect(`/admin/admissions/${id}`);
}));

// // UPDATE SUBMISSION
router.post('/update/:id', isLoggedIn, wrapAsync(async (req, res) => {
    const { id } = req.params;

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

    await Admission.findByIdAndUpdate(id, { ...req.body });
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
router.delete('/delete/:id', isLoggedIn, wrapAsync(async (req, res) => {
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

router.post("/fee-settings/update", isLoggedIn, wrapAsync(async (req, res) => {
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

router.post("/fee-settings/sync", isLoggedIn, wrapAsync(async (req, res) => {
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
router.post("/notices/add", isLoggedIn, uploadNotice.single('noticePdf'), wrapAsync(async (req, res) => {
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
router.post("/notices/:id/toggle-pin", isLoggedIn, wrapAsync(async (req, res) => {
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
router.delete("/notices/:id", isLoggedIn, wrapAsync(async (req, res) => {
    console.log("request")
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




