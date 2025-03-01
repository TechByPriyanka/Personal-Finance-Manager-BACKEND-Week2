import Transaction from "../models/TransactionModel.js";
import Trash from "../models/Trash.js";
import User from "../models/UserSchema.js";
import moment from "moment";

export const addTransactionController = async (req, res) => {
  try {
    const {
      title,
      amount,
      description,
      date,
      category,
      userId,
      transactionType,
      paymentType,
    } = req.body;

    // console.log(title, amount, description, date, category, userId, transactionType, paymentType);

    if (
      !title ||
      !amount ||
      !description ||
      !date ||
      !category ||
      !transactionType ||
      !paymentType
    ) {
      return res.status(408).json({
        success: false,
        messages: "Please Fill all fields",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    let newTransaction = await Transaction.create({
      title: title,
      amount: amount,
      category: category,
      description: description,
      date: date,
      user: userId,
      transactionType: transactionType,
      paymentType: paymentType,
    });

    user.transactions.push(newTransaction);

    user.save();

    return res.status(200).json({
      success: true,
      message: "Transaction Added Successfully",
    });
  } catch (err) {
    return res.status(401).json({
      success: false,
      messages: err.message,
    });
  }
};

export const getAllTransactionController = async (req, res) => {
  try {
    const { userId, type, frequency, startDate, endDate } = req.body;

    console.log(userId, type, frequency, startDate, endDate);

    const user = await User.findById(userId);

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    // Create a query object with the user and type conditions
    const query = {
      user: userId,
    };

    if (type !== 'all') {
      query.transactionType = type;
    }

    // Add date conditions based on 'frequency' and 'custom' range
    if (frequency !== 'custom') {
      query.date = {
        $gt: moment().subtract(Number(frequency), "days").toDate()
      };
    } else if (startDate && endDate) {
      query.date = {
        $gte: moment(startDate).toDate(),
        $lte: moment(endDate).toDate(),
      };
    }

    // console.log(query);

    const transactions = await Transaction.find(query);
    //select * from transaction where date>18/02/2025
    // console.log(transactions);

    return res.status(200).json({
      success: true,
      transactions: transactions,
    });
  } catch (err) {
    return res.status(401).json({
      success: false,
      messages: err.message,
    });
  }
};


export const deleteTransactionController = async (req, res) => {
  try {
    const transactionId = req.params.id;
    const userId = req.body.userId;

    // console.log(transactionId, userId);

    const user = await User.findById(userId);

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }
    const transactionElement = await Transaction.findById(  //finds the transaction by id
      transactionId
    );

    if (!transactionElement) {
      return res.status(400).json({
        success: false,
        message: "transaction not found",
      });
    }

    // soft delete
    transactionElement.isDeleted = true;
    transactionElement.markModified("isDeleted"); //for only deleted transactions
    await transactionElement.save();
     
    // Remove from User's Transaction Array
    user.transactions=user.transactions.filter(
      (trans) => trans.toString() !== transactionId
    );

    user.save();

    // Store in Trash Bin
    const trash = new Trash({
      user: userId,
      transaction: transactionElement._id,
    })
    trash.save();

    return res.status(200).json({
      success: true,
      message: `Transaction successfully moved to Trash`,
    });
  } catch (err) {
    return res.status(401).json({
      success: false,
      messages: err.message,
    });
  }
};

//Delete multiple transactions 

export const multiDeleteTransactionController = async (req, res) => {
  try {
    const { transactionIds, userId } = req.body; // array of transaction IDs
    // console.log(transactionIds, userId);

    const user = await User.findById(userId);

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    if (!transactionIds || transactionIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide transaction IDs",
      });
    }
 
    // Fetch All Transactions
    const transactions = await Transaction.find({ _id: { $in: transactionIds } });

    if (transactions.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No Transactions found",
      });
    }

    // Soft Delete Transactions and Move to Trash Bin

    const trashBin = [];
    for (let transaction of transactions) {
      transaction.isDeleted = true;
      transaction.markModified("isDeleted"); // Only for deleted transactions
      await transaction.save();

      // Remove Transactions from User's Array
    user.transactions = user.transactions.filter(
      (trans) => !transactionIds.includes(trans.toString())
    );

      // Store in Trash Bin
      const trash = new Trash({
        user: userId,
        transaction: transaction._id,
      });

      trash.save();
      trashBin.push(trash);
    }

    user.save();

    return res.status(200).json({
      success: true,
      message: `${transactionIds.length} Transactions Successfully moved to Trash`,
    });
  } catch (err) {
    return res.status(401).json({
      success: false,
      messages: err.message,
    });
  }
};

export const updateTransactionController = async (req, res) => {
  try {
    const transactionId = req.params.id;

    const { title, amount, description, date, category, transactionType, paymentType } =
      req.body;

    // console.log(title, amount, description, date, category, transactionType, paymentType);

    if (!title && !amount && !description && !date && !category && !transactionType && !paymentType) {
      return res.status(400).json({
        success: false,
        message: `Transaction ID ${transactionId}: Please fill at least one field`,
      });
    }

    const transactionElement = await Transaction.findById(transactionId);

    if (!transactionElement) {
      return res.status(400).json({
        success: false,
        message: "transaction not found",
      });
    }

    // can update one or more fileds
    if (title) {
      transactionElement.title = title;
    }

    if (description) {
      transactionElement.description = description;
    }

    if (amount) {
      transactionElement.amount = amount;
    }

    if (category) {
      transactionElement.category = category;
    }
    if (transactionType) {
      transactionElement.transactionType = transactionType;
    }

    if (date) {
      transactionElement.date = date;
    }

    if (paymentType) {
      transactionElement.paymentType = paymentType;
    }

    await transactionElement.save();

    // await transactionElement.remove();

    return res.status(200).json({
      success: true,
      message: `Transaction Updated Successfully`,
      transaction: transactionElement,
    });
  } catch (err) {
    return res.status(401).json({
      success: false,
      messages: err.message,
    });
  }
};

export const multiUpdateTransactionController = async (req, res) => {
  try {
    const { transactionIds } = req.body; 

    if (!transactionIds || transactionIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide transaction IDs to update",
      });
    }

    let updatedTransactions = [];
    
    for (const { transactionId, title, amount, description, date, category, transactionType, paymentType } of transactionIds) {

      if (!title && !amount && !description && !date && !category && !transactionType && !paymentType) {
        return res.status(400).json({
          success: false,
          message: `Transaction ID ${transactionId}: Please fill at least one field`,
        });
      }

      const transactionElement = await Transaction.findById(transactionId);

      if (!transactionElement) {
        return res.status(400).json({
          success: false,
          message: `Transaction with ID ${transactionId} not found`,
        });
      }

      if (title) {
        transactionElement.title = title;
      }
  
      if (description) {
        transactionElement.description = description;
      }
  
      if (amount) {
        transactionElement.amount = amount;
      }
  
      if (category) {
        transactionElement.category = category;
      }
      if (transactionType) {
        transactionElement.transactionType = transactionType;
      }
  
      if (date) {
        transactionElement.date = date;
      }
  
      if (paymentType) {
        transactionElement.paymentType = paymentType;
      }

      await transactionElement.save();
      updatedTransactions.push(transactionElement);
    }

    return res.status(200).json({
      success: true,
      message: `${updatedTransactions.length} Transactions Updated Successfully`,
      updatedTransactions: updatedTransactions,
    });
  } catch (err) {
    return res.status(401).json({
      success: false,
      messages: err.message,
    });
  }
};