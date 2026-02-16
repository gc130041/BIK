import mongoose from 'mongoose';
import Account from './account.model.js';

export const getAccounts = async (req, res) => {
    try {
        const { page = 1, limit = 10, isActive } = req.query;

        const filter = {};
        if (isActive !== undefined) {
            filter.isActive = isActive === 'true'; 
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const accounts = await Account.find(filter)
            .limit(parseInt(limit))
            .skip(skip)
            .sort({ creaAt: 1 }); 

        const total = await Account.countDocuments(filter);

        res.status(200).json({
            success: true, 
            data: accounts,
            pagination: {
                currentPage: parseInt(page), 
                totalPages: Math.ceil(total / limit),
                totalRecords: total,
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener las cuentas',
            error: error.message
        });
    }
};

export const getAccountById = async (req, res) => {
    try {
        const { id } = req.params; 
        let account;

        if (mongoose.Types.ObjectId.isValid(id)) {
            account = await Account.findById(id);
        }
        if (!account) {
            account = await Account.findOne({ numberAccount: id });
        }
        if (!account) {
            account = await Account.findOne({ dpi: id });
        }
        if (!account) {
            return res.status(404).json({
                success: false,
                message: 'Cuenta no encontrada (buscado por ID, Número de Cuenta o DPI)'
            });
        }

        res.status(200).json({
            success: true,
            data: account
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener la cuenta',
            error: error.message
        });
    }
};

export const createAccount = async (req, res) => {
    try {
        const accountData = req.body;

        const account = new Account(accountData);
        await account.save();

        res.status(201).json({
            succes: true,
            message: 'Cuenta creada exitosamente',
            data: account
        });

    } catch (error) {
        res.status(500).json({
            succes: false,
            message: 'Error al crear la cuenta',
            error: error.message
        });
    }
};

export const updateAccount = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = { ...req.body };
        let query = { _id: id };

        if (!mongoose.Types.ObjectId.isValid(id)) {
            query = { $or: [{ numberAccount: id }, { dpi: id }] };
        }

        const account = await Account.findOneAndUpdate(query, updateData, {
            new: true,
            runValidators: true
        });

        if (!account) {
            return res.status(404).json({
                success: false,
                message: 'Cuenta no encontrada'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Cuenta actualizada exitosamente',
            data: account
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error al actualizar la cuenta',
            error: error.message
        });
    }
};

export const changeAccountStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const isActive = req.url.includes('/activate');
        const action = isActive ? 'activada' : 'desactivada';
        let query = { _id: id };

        if (!mongoose.Types.ObjectId.isValid(id)) {
            query = { $or: [{ numberAccount: id }, { dpi: id }] };
        }

        const account = await Account.findOneAndUpdate(
            query,
            { isActive },
            { new: true }
        );

        if (!account) {
            return res.status(404).json({
                success: false,
                message: 'Cuenta no encontrada'
            });
        }

        res.status(200).json({
            success: true,
            message: `Cuenta ${action} exitosamente`,
            data: account
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al cambiar el estado de la cuenta',
            error: error.message
        });
    }
};