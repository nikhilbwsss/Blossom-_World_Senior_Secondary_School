const mongoose = require('mongoose');

const reAdmissionSchema = new mongoose.Schema({
    readmissionId: { type: String, required: true, unique: true, trim: true },
    studentPhoto: {
        url: String,
        filename: String
    },
    className: { type: String, required: true, trim: true },
    studentName: { type: String, required: true, trim: true },
    fatherName: { type: String, required: true, trim: true },
    motherName: { type: String, required: true, trim: true },
    permanentAddress: { type: String, required: true },
    parentWhatsapp: { type: String, required: true, trim: true },
    studentAadhaar: { type: String, required: true, trim: true },
    parentAadhaar: { type: String, required: true, trim: true },
    panNo: { type: String, trim: true },
    parentQualification: { type: String, trim: true },
    distanceFromSchool: { type: String, trim: true },
    admissionNo: { type: String, trim: true },
    classToBeAdmitted: { type: String, required: true, trim: true },
    previousMarksPercentage: { type: String, required: true, trim: true },
    previousAttendancePercentage: { type: String, required: true, trim: true },
    studentSignature: {
        url: { type: String, required: true, trim: true },
        filename: { type: String }
    },
    admissionDate: { type: Date, required: true },
    weight: { type: String, trim: true },
    height: { type: String, trim: true }
}, { timestamps: true });

module.exports = mongoose.model('ReAdmission', reAdmissionSchema);
