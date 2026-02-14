'use strict';

import mongoose from 'mongoose';

const depositSchema = new mongoose.Schema({
    accountId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account',
        required: [true, 'La cuenta de destino es obligatoria']
    },
    amount: {
        type: Number,
        required: [true, 'El monto del depósito es obligatorio'],
        min: [0.01, 'El monto debe ser mayor a 0']
    },
    date: {
        type: Date,
        default: Date.now
    },
    // Opcional: Si el depósito viene de un servicio externo (ej. Remesa)
    originSource: {
        type: String,
        trim: true,
        default: 'Ventanilla'
    },
    description: {
        type: String,
        maxLength: [200, 'La descripción no puede exceder los 200 caracteres'],
        default: 'Depósito a cuenta'
    },
    status: {
        type: String,
        enum: ['COMPLETED', 'PENDING', 'REVERSED'],
        default: 'COMPLETED'
    }
}, {
    versionKey: false,
    timestamps: true
});

depositSchema.index({ accountId: 1, date: -1 });

export default mongoose.model('Deposit', depositSchema);