import { body, param } from 'express-validator';
import { checkValidators } from "./check-validators.js"

export const validateAccount = [
    body('dpi')
        .isLength({ min: 13, max: 13 })
        .withMessage('El DPI debe tener exactamente 13 caracteres'),
    body('typeAcount')
        .isIn(['Monetaria', 'Ahorro', 'NULL'])
        .withMessage('El tipo de cuenta debe ser Monetaria, Ahorro o NULL'),
    body('earningsM')
        .isFloat({ gt: 100 })
        .withMessage('Los ingresos mensuales deben ser un número positivo'),
    body('nameAccount')
        .trim()
        .notEmpty()
        .isLength({ min: 2, max: 100 })
        .withMessage('El nombre del contacto debe tener entre 2 y 100 caracteres'),
    body('email')
        .trim()
        .isEmail()
        .normalizeEmail()
        .withMessage('Por favor ingrese un correo electrónico válido'),
    body('phoneNumber')
        .matches(/^\+?[1-9]\d{1,14}$/)
        .withMessage('Por favor ingrese un número de teléfono válido'),
    checkValidators
];

export const validateUpdateAccount = [
    body('dpi')
        .isLength({ min: 13, max: 13 })
        .withMessage('El DPI debe tener exactamente 13 caracteres'),
    body('typeAcount')
        .isIn(['Monetaria', 'Ahorro', 'NULL'])
        .withMessage('El tipo de cuenta debe ser Monetaria, Ahorro'),
    body('earningsM')
        .isFloat({ gt: 100 })
        .withMessage('Los ingresos mensuales deben ser un número positivo'),
    body('nameAccount')
        .trim()
        .notEmpty()
        .isLength({ min: 2, max: 100 })
        .withMessage('El nombre del contacto debe tener entre 2 y 100 caracteres'),
    body('email')
        .trim()
        .isEmail()
        .normalizeEmail()
        .withMessage('Por favor ingrese un correo electrónico válido'),
    body('phoneNumber')
        .matches(/^\+?[1-9]\d{1,14}$/)
        .withMessage('Por favor ingrese un número de teléfono válido'),
    checkValidators
];