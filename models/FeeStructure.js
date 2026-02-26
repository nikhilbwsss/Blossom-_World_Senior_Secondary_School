const mongoose = require('mongoose');

const feeStructureSchema = new mongoose.Schema({
    className: { 
        type: String, 
        required: true, 
        unique: true, // e.g., "Nursery", "Grade 10"
        trim: true 
    },
    monthlyFee: { 
        type: Number, 
        required: true,
        default: 0 
    },
    admissionFee: { 
        type: Number, 
        default: 0 // One-time annual charge
    },
    lastUpdatedBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' // Tracks which admin made the change
    }
}, { timestamps: true });

module.exports = mongoose.model('FeeStructure', feeStructureSchema);