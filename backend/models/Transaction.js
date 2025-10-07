const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    data: {
      type: String,
      required: true
    },
    dataDate: {
      type: Date,
      required: true
    },
    descricao: {
      type: String,
      required: true,
      trim: true
    },
    valor: {
      type: Number,
      required: true
    },
    tipo: {
      type: String,
      enum: ['entrada', 'saida'],
      required: true
    },
    categoria: {
      type: String,
      required: true,
      trim: true
    },
    mes: {
      type: String,
      required: true
    },
    ano: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true
  }
);

transactionSchema.index({ user: 1, dataDate: -1 });
transactionSchema.index({ user: 1, mes: 1, ano: 1 });

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
