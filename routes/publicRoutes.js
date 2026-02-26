
const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const Admission = require("../models/Admission");
const ReAdmission = require("../models/ReAdmission");
const Contact = require("../models/Contact");
const Notice = require("../models/notice");
const {
    validateAdmission,
    validateReAdmission,
    validateContact,
    uploadStudent
} = require("../middleware/middleware.js");
const rateLimit = require('express-rate-limit');

const admissionLimiter = rateLimit({
    windowMs: 3 * 60 * 1000, // 15 min
    max: 20,                  // 20 requests per IP per window
    standardHeaders: true,
    legacyHeaders: false,
});



// --- GET ROUTES ---
router.get('/', (req, res) => res.render('index'));
router.get("/about/school", (req, res) => res.render("pages/about", { title: "About Us" }));
router.get("/about/vision-and-mission", (req, res) => res.render("pages/vision-and-mission", { title: "Vision and Mission" }));
router.get("/about/message/principal", (req, res) => res.render("pages/the-principal-message", { title: "The Principal's Message" }));
router.get("/about/message/chairman", (req, res) => res.render("pages/chairman-message", { title: "The Chairman Message" }));
router.get("/about/message/director", (req, res) => res.render("pages/director-message", { title: "director" }));
router.get("/about/message/founder", (req, res) => res.render("pages/founder-message", { title: "founder" }));
router.get("/about/information", (req, res) => res.render("pages/school-info", { title: "school-info" }));
router.get("/about/committee", (req, res) => res.render("pages/committee", { title: "committee" }));
router.get("/about/teachers-staff", (req, res) => res.render("pages/teachers-staff", { title: "teachers-staff" }));
router.get("/admission/process", (req, res) => res.render("pages/admission-procedure", { title: "Admission Procedure" }));
router.get("/admission/form", (req, res) => res.render("pages/admission-form", { title: "Admission Form" }));
router.get("/admission/re-admission", (req, res) => res.render("pages/re-admission-form", { title: "Re-Admission Form" }));
router.get("/admission/rules", (req, res) => res.render("pages/rules-regulations", { title: "rules & regulations" }));
router.get("/academics/overview", (req, res) => res.render("pages/academics", { title: "Academics Overview" }));
router.get("/lifeattuis/beyond-academics", (req, res) => res.render("pages/li_beyond", { title: "Beyond Academics" }));
router.get("/lifeattuis/co-curricular-activities", (req, res) => res.render("pages/li_co-curricular-activities", { title: "Co-Curricular Activities" }));
router.get("/lifeattuis/boarding", (req, res) => res.render("pages/li_boarding", { title: "Boarding" }));
router.get("/gallery", (req, res) => res.render("pages/gallery", { Title: "Gallery" }));
router.get("/updates/e-magazine", (req, res) => res.render("pages/e-magazine"));
router.get("/updates/news", (req, res) => res.render("pages/news", { Title: "news" }));
router.get("/contact", (req, res) => res.render("pages/contact"));
router.get("/updates/blogs", (req, res) => res.render("pages/blogs", { Title: "blogs" }));

router.get("/updates/blogs/independence-day", (req, res) => {
    res.render("blogs/independence-day");
});

router.get("/updates/blogs/awards-ceremony", (req, res) => {
    res.render("blogs/awards-ceremony");
});

router.get("/updates/blogs/republic-day", (req, res) => {
    res.render("blogs/republic-day");
});
// Update Notice
// GET: Public Notices Pager
router.get("/updates/notices", async (req, res) => {
    try {
        // Fetch all notices, newest first
        const notices = await Notice.find({}).sort({ createdAt: -1 });

        res.render("pages/notices", {
            title: "Notices & Circulars",
            notices: notices
        });
    } catch (err) {
        console.error(err);
        res.redirect("/");
    }
});



// --- POST ROUTES ---
router.post("/submit-admission",
    admissionLimiter,
    uploadStudent.single('studentPhoto'),
    validateAdmission,
    wrapAsync
        (async (req, res) => {
            if (req.body && req.body.data && (req.body.data.stream === '' || req.body.data.stream == null)) {
                req.body.data.stream = 'None';
            }
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: "Student photo is required."
                });
            }
            let NewAdmission = new Admission(req.body.data);
            let url = req.file.path;
            let filename = req.file.filename;
            NewAdmission.studentPhoto = { url, filename };
            const saved = await NewAdmission.save();
            res.status(200).json({
                success: true,
                message: "Application submitted successfully!",
                applicationId: saved._id
            });
        }));


// router.post("/submit-readmission", uploadStudent.fields([
//     { name: 'studentPhoto', maxCount: 1 },
//     { name: 'studentSignatureFile', maxCount: 1 }
// ]), validateReAdmission, wrapAsync(async (req, res) => {
//     try {
//         const {
//             readmissionId, className, studentName, fatherName, motherName, permanentAddress,
//             parentWhatsapp, studentAadhaar, parentAadhaar, panNo, parentQualification,
//             distanceFromSchool, admissionNo, classToBeAdmitted, previousMarksPercentage,
//             previousAttendancePercentage, admissionDate,
//             weight, height
//         } = req.body;

//         const studentPhoto = req.files && req.files.studentPhoto ? req.files.studentPhoto[0].path : null;
//         const studentSignature = req.files && req.files.studentSignatureFile ? req.files.studentSignatureFile[0].path : null;
//         if (!studentSignature) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Student signature upload is required."
//             });
//         }

//         const newReAdmission = new ReAdmission({
//             readmissionId,
//             studentPhoto,
//             className,
//             studentName,
//             fatherName,
//             motherName,
//             permanentAddress,
//             parentWhatsapp,
//             studentAadhaar,
//             parentAadhaar,
//             panNo,
//             parentQualification,
//             distanceFromSchool,
//             admissionNo,
//             classToBeAdmitted,
//             previousMarksPercentage,
//             previousAttendancePercentage,
//             studentSignature,
//             admissionDate,
//             weight,
//             height
//         });

//         const saved = await newReAdmission.save();
//         res.status(200).json({
//             success: true,
//             message: "Re-admission submitted successfully!",
//             applicationId: saved._id
//         });
//     } catch (err) {
//         console.error("Re-Admission Submission Error:", err);
//         res.status(500).json({
//             success: false,
//             message: "Server error: Could not save re-admission. " + err.message
//         });
//     }
// }));

router.post("/submit-readmission",
    admissionLimiter,
    uploadStudent.fields([
        { name: 'studentPhoto', maxCount: 1 },
        { name: 'studentSignatureFile', maxCount: 1 }
    ]),
    validateReAdmission,          // use the correct validator for re-admission
    wrapAsync(async (req, res) => {
        // ensure files were uploaded
        const studentPhotoFile = req.files && req.files.studentPhoto ? req.files.studentPhoto[0] : null;
        const signatureFile = req.files && req.files.studentSignatureFile ? req.files.studentSignatureFile[0] : null;
        if (!studentPhotoFile || !signatureFile) {
            return res.status(400).json({
                success: false,
                message: "Both student photo and signature are required."
            });
        }

        let newReAdmission = new ReAdmission(req.body.data);
        newReAdmission.studentPhoto = {
            url: studentPhotoFile.path,
            filename: studentPhotoFile.filename
        };
        newReAdmission.studentSignature = {
            url: signatureFile.path,
            filename: signatureFile.filename
        };

        const saved = await newReAdmission.save();
        res.status(200).json({
            success: true,
            message: "Application submitted successfully!",
            applicationId: saved._id
        });
    }));

// POST: Process the form submission
router.post('/submit-enquiryForm', validateContact, wrapAsync(async (req, res) => {
    const newEnquiry = new Contact(req.body);
    await newEnquiry.save();

    res.status(200).json({
        message: "Enquiry sent successfully! We will contact you soon."
    });
}));

module.exports = router;
