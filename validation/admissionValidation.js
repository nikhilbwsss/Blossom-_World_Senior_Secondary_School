const Joi = require('joi');

const validateAdmission = (data) => {
    const schema = Joi.object({
        firstName: Joi.string().min(2).max(50).required(),
        middleName: Joi.string().allow('', null),
        lastName: Joi.string().min(2).max(50).required(),
        fatherName: Joi.string().required(),
        motherName: Joi.string().required(),
        email: Joi.string().email().required(),
        mobile: Joi.string().pattern(/^[0-9]{10}$/).required().messages({
            'string.pattern.base': 'Mobile number must be exactly 10 digits.'
        }),
        dob: Joi.date().iso().required(),
        gender: Joi.string().valid('Male', 'Female').required(),
        admissionType: Joi.string().valid('Boarder', 'Day Boarder', 'Day Scholar').required(),
        requiredClass: Joi.string().required(),
        lastClassPassed: Joi.string().required(),
        previousSchool: Joi.string().allow('', null)
    });

    return schema.validate(data);
};

module.exports = validateAdmission;