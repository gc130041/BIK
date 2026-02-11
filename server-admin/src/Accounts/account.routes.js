import { Router } from 'express';
import { getAccounts, getAccountById, createAccount, updateAccount } from './account.controller.js';

import {
        validateCreateAccount, 
        validateUpdateAccount,
        validateGetAccountById
    } from "../../middlewares/accounts-validators.js";

const router = Router();

//GET
router.get('/', getAccounts);
router.get('/:id', validateGetAccountById, getAccountById);

//POST
router.post('/', validateCreateAccount, createAccount);

//PUT 
router.put('/:id', validateUpdateAccount, updateAccount);

export default router;
