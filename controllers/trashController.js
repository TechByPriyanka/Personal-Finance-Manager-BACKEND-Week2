import Trash from "../models/Trash.js";
import Transaction from "../models/TransactionModel.js";


export const getAllTrashTransactions = async (req, res) => {
  try {
    const { userId } = req.body;

    const trashTransactions = await Trash.find({ user: userId }).populate({
        path: "transaction",
        model: "Transaction",
    });

    return res.status(200).json({
      success: true,
      transactions: trashTransactions,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const restoreTransaction = async (req, res) => {
  try {
    const { trashId } = req.params;

    const trash = await Trash.findById(trashId).populate("transaction");

    if (!trash) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found in trash",
      });
    }

    const transaction = trash.transaction;
    transaction.isDeleted = false;
    await transaction.save();

    await Trash.findByIdAndDelete(trashId);

    return res.status(200).json({
      success: true,
      message: "Transaction restored successfully",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const restoreMultipleTransactions = async (req, res) => {
    try {
      const { trashIds } = req.body; // Array of Trash IDs
  
      if (!trashIds || trashIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Please provide trash IDs",
        });
      }
  
      const trashes = await Trash.find({ _id: { $in: trashIds } }).populate(
        "transaction"
      );
  
      if (trashes.length === 0) {
        return res.status(404).json({
          success: false,
          message: "No Transactions found in trash",
        });
      }
  
      for (let trash of trashes) {
        const transaction = trash.transaction;
  
        if (transaction) {
          transaction.isDeleted = false;
          await transaction.save();
  
          // Remove the isDeleted field from the document
          await Transaction.updateOne(
            { _id: transaction._id },
            { $unset: { isDeleted: "" } }
          );
  
          await Trash.findByIdAndDelete(trash._id);
        }
      }
  
      return res.status(200).json({
        success: true,
        message: "Transactions restored successfully",
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  };

//   Deletes single and multiple transactions permanently

  export const deleteMultipleTransactions = async (req, res) => {  
    try {
      const { trashIds } = req.body; // Array of trash IDs
  
      if (!trashIds || trashIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No transactions selected for deletion",
        });
      }
  
      // Find all Trash Items
      const trashes = await Trash.find({ _id: { $in: trashIds } }).populate("transaction");
  
      if (!trashes.length) {
        return res.status(404).json({
          success: false,
          message: "Transactions not found in trash",
        });
      }
  
      // Delete transactions permanently
      for (const trash of trashes) {
        await Transaction.findByIdAndDelete(trash.transaction._id); // Delete from Transaction collection
        await Trash.findByIdAndDelete(trash._id); // Delete from Trash collection
      }
  
      return res.status(200).json({
        success: true,
        message: "Transactions permanently deleted",
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  };