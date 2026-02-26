const Joi = require('joi');

const digitsCount = (value) => String(value ?? '').replace(/\D/g, '').length;

const looseNumeric10 = (label, { required } = { required: false }) => {
    let s = Joi.string()
        .pattern(/^[0-9 .]+$/)
        .custom((value, helpers) => {
            if (digitsCount(value) > 10) return helpers.error('string.maxDigits', { limit: 10 });
            return value;
        })
        .messages({
            'string.pattern.base': `${label} must contain only numbers, spaces, and dot (.)`,
            'string.maxDigits': `${label} must be at most {#limit} digits`,
        });

    if (required) {
        s = s.required().messages({ 'any.required': `${label} is required`, 'string.empty': `${label} is required` });
    } else {
        s = s.allow('', null);
    }
    return s;
};

const aadhaar12 = (label) =>
    Joi.string()
        .pattern(/^[0-9]{12}$/)
        .required()
        .messages({
            'any.required': `${label} is required`,
            'string.empty': `${label} is required`,
            'string.pattern.base': `${label} must be exactly 12 digits`,
        });

const admissionSchema = (data) => {
    const schema = Joi.object({
        // Student Info
        firstName: Joi.string().required(),
        middleName: Joi.string().allow('', null),
        lastName: Joi.string().required(),
        aadhaarNumber: Joi.string().allow('', null),
        apaarId: Joi.string().allow('', null),
        dob: Joi.date().required(),
        gender: Joi.string().valid('Male', 'Female', 'Other').required(),
        bloodGroup: Joi.string().allow('', null),
        identificationMark: Joi.string().allow('', null),
        religion: Joi.string().allow('', null),
        caste: Joi.string().allow('', null),
        nationality: Joi.string().allow('', null),

        // Parental Info
        fatherName: Joi.string().required(),
        fatherOccupation: Joi.string().allow('', null),
        fatherIncome: Joi.string().allow('', null),
        fatherEducation: Joi.string().allow('', null),
        fatherAadhaar: Joi.string().allow('', null),
        fatherWhatsApp: Joi.string().allow('', null),
        motherName: Joi.string().required(),
        motherOccupation: Joi.string().allow('', null),
        motherIncome: Joi.string().allow('', null),
        motherEducation: Joi.string().allow('', null),
        motherAadhaar: Joi.string().allow('', null),
        motherContact: Joi.string().allow('', null),
        motherWhatsApp: Joi.string().allow('', null),

        // Contact & Address
        email: Joi.string().email().allow('', null), // Optional email
        mobile: Joi.string().required(), // Relaxed for different formats
        altMobile: Joi.string().allow('', null),
        permanentAddress: Joi.string().required(),
        presentAddress: Joi.string().required(),
        localGuardianName: Joi.string().allow('', null),
        siblingsInSchool: Joi.string().allow('', null),
        distanceFromSchool: Joi.string().allow('', null),

        // Admission Choice
        requiredClass: Joi.string().required(),
        stream: Joi.string().allow('', null),
        selectedSubjects: Joi.array().items(Joi.string()).allow(null),

        // Health & Transfer
        isHandicapped: Joi.string().valid('Yes', 'No').allow('', null),
        handicapDetails: Joi.string().allow('', null),
        height: Joi.string().allow('', null),
        weight: Joi.string().allow('', null),
        previousSchool: Joi.string().allow('', null),
        previousSchoolDise: Joi.string().allow('', null),
        prevPenNo: Joi.string().allow('', null),
        previousResult: Joi.string().allow('', null),
        prevAttendance: Joi.string().allow('', null),
        prevClass: Joi.string().allow('', null),
        prevSchoolAddress: Joi.string().allow('', null),
        
        // Checklist
        documentsSubmitted: Joi.array().items(Joi.string()).allow(null)

    }).unknown(); // Allows extra fields without crashing

    return schema.validate(data);
};

const reAdmissionSchema = (data) => {
    const schema = Joi.object({
        readmissionId: Joi.string().required(),
        className: Joi.string().required(),
        studentName: Joi.string().required(),
        fatherName: Joi.string().required(),
        motherName: Joi.string().required(),
        permanentAddress: Joi.string().required(),
        parentWhatsapp: looseNumeric10('Parent WhatsApp No', { required: true }),
        studentAadhaar: aadhaar12('Student Aadhaar No'),
        parentAadhaar: aadhaar12('Parent Aadhaar No'),
        panNo: Joi.string().allow('', null),
        parentQualification: Joi.string().allow('', null),
        distanceFromSchool: Joi.string().allow('', null),
        applicationPlace: Joi.string().allow('', null),
        admissionNo: Joi.string().allow('', null),
        classToBeAdmitted: Joi.string().required(),
        previousMarksPercentage: looseNumeric10('Previous Marks', { required: true }),
        previousAttendancePercentage: looseNumeric10('Previous Attendance', { required: true }),
        studentSignature: Joi.string().allow('', null),
        admissionDate: Joi.date().required(),
        weight: looseNumeric10('Weight', { required: false }),
        height: looseNumeric10('Height', { required: false })
    }).unknown();
    return schema.validate(data);
};

// 2. Contact Form Validation
const contactSchema = (data) => {
    const schema = Joi.object({
        name: Joi.string().min(2).max(50).required(),
        email: Joi.string().email().required(),
        phone: Joi.string().pattern(/^[0-9]{10,12}$/).required(),
        subject: Joi.string().min(3).required(),
        message: Joi.string().min(10).required()
    });
    return schema.validate(data);
};

// Separate Exports
module.exports = {
    admissionSchema,
    reAdmissionSchema,
    contactSchema
};
