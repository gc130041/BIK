import { Router } from 'express';
import { getAccounts, getAccountById, createAccount, updateAccount, changeAccountStatus } from './account.controller.js';

import {
        validateCreateAccount, 
        validateUpdateAccount,
        validateGetAccountById,
        validateAccountStatusChange
    } from "../../middlewares/accounts-validators.js";

const router = Router();

//GET
router.get('/', getAccounts);
router.get('/:id', validateGetAccountById, getAccountById);

//POST
router.post('/:id', validateCreateAccount, createAccount);

//PUT 
router.put('/:id', validateUpdateAccount, updateAccount);
router.put('/:id/activate', validateAccountStatusChange, changeAccountStatus);
router.put('/:id/desactivate', validateAccountStatusChange, changeAccountStatus);

export default router;
