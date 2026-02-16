'use strict';

import Deposit from './deposit.model.js';
import Account from '../accounts/account.model.js';
import mongoose from 'mongoose';

/**
 * CREAR DEPÓSITO
 * Suma al 'earningsM' de la cuenta destino.
 */
export const createDeposit = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { accountId, amount, description } = req.body;

        if (amount <= 0) throw new Error('El monto debe ser mayor a 0');

        // 1. Verificar cuenta
        const account = await Account.findById(accountId).session(session);
        if (!account) throw new Error('Cuenta no encontrada');
        if (!account.isActive) throw new Error('Cuenta inactiva, no se puede depositar');

        // 2. Crear registro de depósito
        const deposit = new Deposit({
            accountId,
            amount,
            description: description || 'Depósito bancario',
            status: 'COMPLETED'
        });
        await deposit.save({ session });

        // 3. Actualizar saldo (earningsM)
        account.earningsM += parseFloat(amount);
        await account.save({ session });

        await session.commitTransaction();
        session.endSession();

        res.status(200).json({
            success: true,
            message: 'Depósito realizado con éxito',
            deposit,
            currentBalance: account.earningsM
        });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        res.status(500).json({
            success: false,
            message: 'Error al realizar depósito',
            error: error.message
        });
    }
};

/**
 * OBTENER DEPÓSITOS POR CUENTA
 */
export const getDeposits = async (req, res) => {
    try {
        const { accountId } = req.params;
        const { limit = 5 } = req.query;

        const deposits = await Deposit.find({ accountId })
            .populate('accountId', 'numberAccount nameAccount')
            .sort({ date: -1 })
            .limit(parseInt(limit));

        res.status(200).json({
            success: true,
            deposits
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener depósitos',
            error: error.message
        });
    }
};