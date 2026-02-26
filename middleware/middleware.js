const ExpressError = require('../utils/expressError'); // Check case sensitivity
const { admissionSchema, reAdmissionSchema, contactSchema } = require('../models/schema');
const multer = require('multer');
const { storage, storagePdf } = require('../cloudConfig');
const allowed = new Set(['image/jpeg', 'image/png', 'image/webp']);
 // Your provided code

const validateAdmission = (req, res, next) => {
    let payload = req.body && req.body.data ? req.body.data : null;
    if (!payload && req.body) {
        const extracted = {};
        let hasDataKeys = false;
        for (const [key, value] of Object.entries(req.body)) {
            const match = key.match(/^data\[(.+)\]$/);
            if (match) {
                extracted[match[1]] = value;
                hasDataKeys = true;
            }
        }
        if (hasDataKeys) {
            req.body.data = extracted;
            payload = extracted;
        } else {
            payload = req.body;
        }
    }
    if (payload) {
        if (payload.documentsSubmitted && !Array.isArray(payload.documentsSubmitted)) {
            payload.documentsSubmitted = [payload.documentsSubmitted];
        }
        if (payload.selectedSubjects && !Array.isArray(payload.selectedSubjects)) {
            payload.selectedSubjects = [payload.selectedSubjects];
        }
    }
    const { error } = admissionSchema(payload); // Calling it as a function is correct here!
    if (error) {
        const msg = error.details.map(el => el.message).join(',');
        throw new ExpressError(400, msg);
    }
    next();
};

const validateContact = (req, res, next) => {
    const { error } = contactSchema(req.body); // Calling it as a function is correct here!
    if (error) {
        const msg = error.details.map(el => el.message).join(',');
        throw new ExpressError(400, msg);
    }
    next();
};

const validateReAdmission = (req, res, next) => {
    // mirror extraction logic from validateAdmission
    let payload = req.body && req.body.data ? req.body.data : null;
    if (!payload && req.body) {
        const extracted = {};
        let hasDataKeys = false;
        for (const [key, value] of Object.entries(req.body)) {
            const match = key.match(/^data\[(.+)\]$/);
            if (match) {
                extracted[match[1]] = value;
                hasDataKeys = true;
            }
        }
        if (hasDataKeys) {
            req.body.data = extracted;
            payload = extracted;
        } else {
            payload = req.body;
        }
    }
    if (payload) {
        if (payload.documentsSubmitted && !Array.isArray(payload.documentsSubmitted)) {
            payload.documentsSubmitted = [payload.documentsSubmitted];
        }
        if (payload.selectedSubjects && !Array.isArray(payload.selectedSubjects)) {
            payload.selectedSubjects = [payload.selectedSubjects];
        }

        const toStr = (v) => (v == null ? '' : String(v));
        const digitsOnly = (v) => toStr(v).replace(/\D+/g, '');
        const sanitizeLoose = (v) => toStr(v).replace(/[^0-9 .]/g, '');

        if (payload.parentWhatsapp != null) payload.parentWhatsapp = sanitizeLoose(payload.parentWhatsapp);
        if (payload.previousMarksPercentage != null) payload.previousMarksPercentage = sanitizeLoose(payload.previousMarksPercentage);
        if (payload.previousAttendancePercentage != null) payload.previousAttendancePercentage = sanitizeLoose(payload.previousAttendancePercentage);
        if (payload.height != null) payload.height = sanitizeLoose(payload.height);
        if (payload.weight != null) payload.weight = sanitizeLoose(payload.weight);

        if (payload.studentAadhaar != null) payload.studentAadhaar = digitsOnly(payload.studentAadhaar);
        if (payload.parentAadhaar != null) payload.parentAadhaar = digitsOnly(payload.parentAadhaar);
    }
    const { error } = reAdmissionSchema(payload);
    if (error) {
        const msg = error.details.map(el => el.message).join(',');
        throw new ExpressError(400, msg);
    }
    next();
};


// check here login or not
const isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        // 2. Store the URL they were trying to reach (optional but helpful)
        req.session.redirectUrl = req.originalUrl;
        
        // 3. Send a red error message
        req.flash("error", "Access Denied! You must be logged in as an Admin.");
        return res.redirect("/admin/login");
    }
    
    // 4. If logged in, proceed to the next function
    next();
};

// New helper function to persist the URL
const saveRedirectUrl = (req, res, next) => {
    if (req.session.redirectUrl) {
        res.locals.redirectUrl = req.session.redirectUrl;
    }
    next();
};


// Student Photo Gatekeeper (1MB)
// const uploadStudent = multer({ 
//     storage: storage,
//     limits: { fileSize: 1 * 1024 * 1024 } 
// });

const uploadStudent = multer({
  storage,
  limits: { fileSize: 1 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!allowed.has(file.mimetype)) {
      return cb(new Error('Only JPG, PNG, WEBP images are allowed'), false);
    }
    cb(null, true);
  }
});

// Notice PDF Gatekeeper (10MB)
const uploadNotice = multer({ 
    storage: storagePdf,
    limits: { fileSize: 10 * 1024 * 1024 } 
});

// CRITICAL: Export both as an object
module.exports = { 
    uploadStudent,
    uploadNotice,
    validateAdmission, 
    validateReAdmission,
    validateContact,
    isLoggedIn,
    saveRedirectUrl,
};
