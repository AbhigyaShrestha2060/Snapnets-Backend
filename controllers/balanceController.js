import Balance from '../models/balanceModel.js';

// Controller to add or update user balance
export const updateUserBalance = async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount, pidx } = req.body;

    if (!amount || isNaN(amount)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or missing amount',
      });
    }

    let balance = await Balance.findOne({ user: userId });

    if (balance) {
      // Check if the pidx is already present in the transactions array
      const pidxExists = balance.transactions.some(
        (transaction) => transaction.pidx === pidx
      );
      if (pidxExists) {
        return res.status(400).json({
          success: false,
          message: 'Transaction already exists',
        });
      }

      // Update the balance and add the transaction
      balance.balance += parseFloat(amount);
      const newTransaction = {
        amount: parseFloat(amount),
        pidx,
        transactionDate: new Date(),
      };
      balance.transactions.push(newTransaction);
      await balance.save();
    } else {
      // Create a new balance document with the initial transaction
      balance = new Balance({
        balance: parseFloat(amount),
        transactions: [
          {
            amount: parseFloat(amount),
            pidx,
            transactionDate: new Date(),
          },
        ],
        user: userId,
      });
      await balance.save();
    }

    res.status(200).json({
      success: true,
      message: 'Balance updated successfully',
      balance: balance.balance,
      transactions: balance.transactions,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Get all users with their balances
export const getAllUsersWithBalances = async (req, res) => {
  try {
    const usersWithBalances = await Balance.find()
      .populate('user', 'username email phoneNumber profilePicture')
      .exec();

    res.status(200).json({
      success: true,
      data: usersWithBalances,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const withdrawUserBalance = async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount } = req.body;

    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or missing withdrawal amount',
      });
    }

    const balance = await Balance.findOne({ user: userId });

    if (!balance) {
      return res.status(404).json({
        success: false,
        message: 'Balance not found for this user',
      });
    }

    if (balance.balance < amount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance',
      });
    }

    balance.balance -= parseFloat(amount);
    balance.transactions.push({
      amount: -parseFloat(amount),
      transactionDate: new Date(),
    });
    await balance.save();

    res.status(200).json({
      success: true,
      message: 'Withdrawal successful',
      balance: balance.balance,
      transactions: balance.transactions,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Get balance and user details for a specific user
export const getUserBalanceWithTransactions = async (req, res) => {
  try {
    const userId = req.user.id;

    const balance = await Balance.findOne({ user: userId })
      .populate('user', 'username email phoneNumber')
      .exec();

    if (!balance) {
      return res.status(404).json({
        success: false,
        message: 'Balance not found for this user',
      });
    }

    const formattedTransactions = balance.transactions.map((transaction) => ({
      amount: transaction.amount,
      type: transaction.amount > 0 ? 'Deposit' : 'Withdrawal',
      transactionDate: new Date(transaction.transactionDate).toLocaleDateString(
        'en-GB'
      ),
    }));

    res.status(200).json({
      success: true,
      data: {
        balance: balance.balance,
        user: balance.user,
        transactions: formattedTransactions,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
