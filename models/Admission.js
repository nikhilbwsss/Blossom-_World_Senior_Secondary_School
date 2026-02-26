const mongoose = require('mongoose');

const admissionSchema = new mongoose.Schema({
    // --- 1. STUDENT PARTICULARS ---
    firstName: { type: String, required: true, trim: true },
    middleName: { type: String, trim: true },
    lastName: { type: String, required: true, trim: true },
    studentPhoto: {
         url: String,
         filename: String
         }, 
    aadhaarNumber: { type: String, trim: true },
    apaarId: { type: String, trim: true },
    dob: { type: Date, required: true },
    gender: { type: String, required: true, enum: ['Male', 'Female', 'Other'] },
    bloodGroup: { type: String },
    identificationMark: { type: String },
    religion: { type: String },
    caste: { type: String },
    nationality: { type: String, default: 'Indian' },
    
    // --- 2. FATHER'S DETAILS ---
    fatherName: { type: String, required: true, trim: true },
    fatherOccupation: { type: String },
    fatherIncome: { type: String },
    fatherEducation: { type: String },
    fatherAadhaar: { type: String },
    mobile: { type: String, required: true }, // Main Contact No
    altMobile: { type: String },
    fatherWhatsApp: { type: String },

    // --- 3. MOTHER'S DETAILS ---
    motherName: { type: String, required: true, trim: true },
    motherOccupation: { type: String },
    motherIncome: { type: String },
    motherEducation: { type: String },
    motherAadhaar: { type: String },
    motherContact: { type: String },
    motherWhatsApp: { type: String },

    // --- 4. ADDRESS & LOCAL GUARDIAN ---
    permanentAddress: { type: String, required: true },
    presentAddress: { type: String, required: true },
    applicationPlace: { type: String },
    localGuardianName: { type: String },
    siblingsInSchool: { type: String }, // Name and Class of brother/sister

    // --- 5. HEALTH & PHYSICAL DETAILS ---
    isHandicapped: { type: String, enum: ['Yes', 'No'], default: 'No' },
    handicapDetails: { type: String },
    height: { type: String }, // e.g. "140 cm"
    weight: { type: String }, // e.g. "35 kg"
    distanceFromSchool: { type: String },

    // --- 6. ADMISSION CHOICE ---
    requiredClass: { type: String, required: true },
    stream: { 
        type: String, 
        enum: ['Science', 'Commerce', 'Arts', 'None'], 
        default: 'None' 
    },
    selectedSubjects: [{ type: String }], // Array for Class 11/12 choices

    // --- 7. TRANSFER STUDENT DETAILS ---
    previousSchool: { type: String, trim: true },
    previousSchoolDise: { type: String },
    previousSchoolPen: { type: String },
    previousSchoolApaar: { type: String },
    previousSchoolAddress: { type: String },
    previousSchoolClass: { type: String },
    previousSchoolResult: { type: String }, // Percentage/Grade
    previousSchoolAttendance: { type: String },

    // --- 8. DOCUMENT CHECKLIST ---
    documentsSubmitted: [{ type: String }], // Array of strings from the checkboxes

    // --- 9. PORTAL & OFFICE MANAGEMENT ---
    status: {
        type: String,
        enum: ['Pending', 'Contacted', 'Approved', 'Rejected'],
        default: 'Pending'
    },
    formNo: { type: String },
    admissionNo: { type: String },
    officeOrder: { type: String },
    officeRemarks: { type: String },
    officeDocStatus: { type: String, enum: ['Complete', 'Incomplete'], default: 'Incomplete' },
    admissionAllowed: { type: String, enum: ['Allowed', 'Not Allowed', 'Provisional'] },
    
    adminNotes: { type: String, default: "" },
    section: { type: String, default: 'A' },

    // --- 10. FEE MANAGEMENT ---
    fees: {
        totalAnnualFee: { type: Number, default: 0 },
        amountPaid: { type: Number, default: 0 },
        dueDate: { type: Date },
        paymentHistory: [{
            amount: Number,
            date: { type: Date, default: Date.now },
            mode: { type: String, enum: ['Cash', 'Online', 'Cheque'] }
        }]
    },

    submittedAt: { type: Date, default: Date.now }
});

// --- VIRTUALS & LOGIC ---
admissionSchema.virtual('overdueAmount').get(function() {
    const today = new Date();
    const balance = this.fees.totalAnnualFee - this.fees.amountPaid;
    if (balance > 0 && this.fees.dueDate && today > this.fees.dueDate) {
        return balance;
    }
    return 0;
});

admissionSchema.set('toObject', { virtuals: true });
admissionSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Admission', admissionSchema);
