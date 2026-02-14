'use strict';

import Transaction from './transaction.model.js';
import Service from '../Services/service.model.js';
import Account from '../Accounts/account.model.js';
import mongoose from 'mongoose';

/**
 * TRANSFERENCIA ENTRE CUENTAS (P2P)
 * Reglas: Max Q2000 por envío, Max Q100 diarios, No exceder saldo.
 */
export const makeTransfer = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { sourceAccountId, destinationAccountId, amount, description } = req.body;
        const amountNum = parseFloat(amount);

        // --- 1. VALIDACIONES BÁSICAS ---
        if (sourceAccountId === destinationAccountId) {
            throw new Error('No puedes transferir a tu propia cuenta');
        }
        if (amountNum <= 0) {
            throw new Error('El monto debe ser mayor a 0');
        }

        // --- 2. REGLAS DE NEGOCIO ---
        
        // Regla A: Máximo Q2000 por transferencia
        if (amountNum > 2000) {
            throw new Error('El límite máximo por transferencia es de Q2000.00');
        }

        // Regla B: Límite diario acumulado (Q100.00)
        // Calculamos el inicio y fin del día actual
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        // Buscamos cuánto ha transferido hoy el usuario (Aggregate)
        const dailyTransactions = await Transaction.aggregate([
            {
                $match: {
                    sourceAccount: new mongoose.Types.ObjectId(sourceAccountId), // Convertir a ObjectId es vital en aggregate
                    transactionType: 'TRANSFERENCIA', // Solo contamos transferencias, no pagos de servicio (opcional)
                    status: 'COMPLETED',
                    date: { $gte: startOfDay, $lte: endOfDay }
                }
            },
            {
                $group: {
                    _id: null, // Agrupamos todo en un solo resultado
                    totalAmount: { $sum: '$amount' } // Sumamos el campo amount
                }
            }
        ]).session(session);

        // Si no hay transacciones hoy, el total es 0
        const currentDailyTotal = dailyTransactions.length > 0 ? dailyTransactions[0].totalAmount : 0;

        // Verificamos si la nueva transferencia rompe el límite diario
        if (currentDailyTotal + amountNum > 100) {
            throw new Error(`Has alcanzado tu límite diario. Has transferido Q${currentDailyTotal} hoy y el límite es Q100.`);
        }

        // --- 3. BUSCAR CUENTAS Y SALDOS ---

        // Buscar cuenta de origen
        const sourceAccount = await Account.findById(sourceAccountId).session(session);
        if (!sourceAccount) throw new Error('Cuenta de origen no encontrada');
        if (!sourceAccount.isActive) throw new Error('La cuenta de origen está inactiva');

        // Regla C: No exceder saldo disponible
        if (sourceAccount.earningsM < amountNum) {
            throw new Error('Fondos insuficientes para realizar la transferencia');
        }

        // Buscar cuenta de destino
        const destinationAccount = await Account.findById(destinationAccountId).session(session);
        if (!destinationAccount) throw new Error('Cuenta de destino no encontrada');
        if (!destinationAccount.isActive) throw new Error('La cuenta de destino está inactiva');

        // --- 4. OPERACIÓN ATÓMICA ---
        
        // Restar saldo origen
        sourceAccount.earningsM -= amountNum;
        // Sumar saldo destino
        destinationAccount.earningsM += amountNum;

        await sourceAccount.save({ session });
        await destinationAccount.save({ session });

        // --- 5. REGISTRAR TRANSACCIÓN ---
        const transaction = new Transaction({
            sourceAccount: sourceAccountId,
            destinationAccount: destinationAccountId,
            amount: amountNum,
            transactionType: 'TRANSFERENCIA',
            description: description || 'Transferencia entre cuentas',
            status: 'COMPLETED',
            date: new Date() // Aseguramos fecha actual
        });

        await transaction.save({ session });

        await session.commitTransaction();
        session.endSession();

        res.status(200).json({
            success: true,
            message: 'Transferencia realizada con éxito',
            transaction
        });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        res.status(400).json({
            success: false,
            message: 'Error en la transferencia',
            error: error.message
        });
    }
};

/**
 * PAGO DE SERVICIOS
 */
export const payService = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { sourceAccountId, amount, typeService, nameService, numberAccountPay, methodPayment } = req.body;
        const amountNum = parseFloat(amount);

        const sourceAccount = await Account.findById(sourceAccountId).session(session);
        if (!sourceAccount) throw new Error('Cuenta de origen no encontrada');
        if (!sourceAccount.isActive) throw new Error('La cuenta está inactiva');
        
        // Validar saldo
        if (sourceAccount.earningsM < amountNum) {
            throw new Error('Fondos insuficientes para pagar el servicio');
        }

        sourceAccount.earningsM -= amountNum;
        await sourceAccount.save({ session });

        const newService = new Service({
            nameService: nameService || 'Pago de servicios',
            typeService,
            numberAccountPay,
            methodPayment: methodPayment || 'Bancaria',
            amounth: amountNum,
            status: 'COMPLETED'
        });
        await newService.save({ session });

        const transaction = new Transaction({
            sourceAccount: sourceAccountId,
            amount: amountNum,
            transactionType: 'PAGO_SERVICIO',
            serviceId: newService._id,
            description: `Pago de ${typeService} - Ref: ${numberAccountPay}`,
            status: 'COMPLETED'
        });
        await transaction.save({ session });

        await session.commitTransaction();
        session.endSession();

        res.status(200).json({
            success: true,
            message: 'Servicio pagado con éxito',
            service: newService,
            transaction
        });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        res.status(400).json({
            success: false,
            message: 'Error al pagar servicio',
            error: error.message
        });
    }
};

/**
 * OBTENER HISTORIAL
 */
export const getTransactionHistory = async (req, res) => {
    try {
        const { accountId } = req.params;
        const { limit = 10, page = 1 } = req.query;

        const query = {
            $or: [
                { sourceAccount: accountId },
                { destinationAccount: accountId }
            ]
        };

        const transactions = await Transaction.find(query)
            .populate('sourceAccount', 'numberAccount nameAccount')
            .populate('destinationAccount', 'numberAccount nameAccount')
            .populate('serviceId', 'nameService typeService')
            .sort({ date: -1 }) // <--- "Ordenadas por fecha"
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Transaction.countDocuments(query);

        res.status(200).json({
            success: true,
            total,
            transactions,
            pagination: {
                page: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalRecords: total
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener historial',
            error: error.message
        });
    }
};

// ... getTransactionById ...
export const getTransactionById = async (req, res) => {
    try {
        const { id } = req.params;
        const transaction = await Transaction.findById(id)
            .populate('sourceAccount', 'numberAccount nameAccount')
            .populate('destinationAccount', 'numberAccount nameAccount')
            .populate('serviceId');

        if (!transaction) return res.status(404).json({ success: false, message: 'Transacción no encontrada' });

        res.status(200).json({ success: true, data: transaction });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error', error: error.message });
    }
};