import express from 'express';
import { addTransactionController, deleteTransactionController, getAllTransactionController, multiDeleteTransactionController, updateTransactionController, multiUpdateTransactionController } from '../controllers/transactionController.js';

const router = express.Router();

router.route("/addTransaction").post(addTransactionController);

router.route("/getTransaction").post(getAllTransactionController);

router.route("/deleteTransaction/:id").post(deleteTransactionController);

router.route("/multiDeleteTransaction").post(multiDeleteTransactionController);

router.route('/updateTransaction/:id').put(updateTransactionController);

router.route('/multiUpdateTransaction').put(multiUpdateTransactionController);

export default router;