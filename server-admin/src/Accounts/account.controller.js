import Account from './account.model.js';

export const getAccounts = async (req, res) => {
    try {
        const { page = 1, limit = 10, isActive } = req.query;
        const filter = { isActive };

        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            sort: { createdAt: 1 },
        };

        const accounts = await Account.find(filter)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort(options.sort);

        const total = await Account.countDocuments(filter);

        res.status(200).json({
            succes: true,
            data: accounts,
            pagination: {
                cuurentPage: page,
                totalPages: Math.ceil(total / limit),
                totalRecords: total,
                limit: limit
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
        const account = await Account.findById(id);

        if (!account) {
            return res.status(404).json({
                success: false,
                message: 'Cuenta no encontrada'
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

        const account = await Account.findByIdAndUpdate(id, updateData, {
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
