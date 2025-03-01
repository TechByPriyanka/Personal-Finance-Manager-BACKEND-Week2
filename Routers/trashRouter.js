import express from "express";
import { getAllTrashTransactions, restoreTransaction, restoreMultipleTransactions, deleteMultipleTransactions} from "../controllers/trashController.js";

const router = express.Router();

router.route("/getalltrash").post(getAllTrashTransactions);

router.route("/restoreTransaction/:trashId").post(restoreTransaction);

router.route("/restoreMultiTransactions").post(restoreMultipleTransactions);

router.route("/deleteMultiTransactions").post(deleteMultipleTransactions);

export default router;