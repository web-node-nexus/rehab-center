const { Op, fn, col } = require('sequelize');
const { CashEntry, User } = require('../models');
const AppError = require('../utils/AppError');
const { parsePagination, success, istPeriodBounds } = require('../utils/helpers');

const METHODS = ['cash', 'upi', 'bank', 'card', 'other'];

const parseOptionalText = (value) => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const text = String(value).trim();
  return text.length ? text : null;
};

const toMoney = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? Number(n.toFixed(2)) : 0;
};

const mapEntry = (row) => {
  const data = row.toJSON ? row.toJSON() : { ...row };
  data.amount = toMoney(data.amount);
  return data;
};

const parseAmount = (raw) => {
  const amount = Number(raw);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new AppError('A valid amount greater than 0 is required', 400);
  }
  return Number(amount.toFixed(2));
};

const parseBody = (body) => {
  if (!['incoming', 'outgoing'].includes(body.type)) {
    throw new AppError('Type must be incoming or outgoing', 400);
  }
  const partyName = String(body.party_name || '').trim();
  if (partyName.length < 2) {
    throw new AppError(
      body.type === 'outgoing'
        ? 'Enter who received the money'
        : 'Enter who paid / sent the money',
      400
    );
  }
  const date = String(body.entry_date || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new AppError('A valid date is required', 400);
  }
  const purpose = parseOptionalText(body.purpose);
  if (body.type === 'outgoing' && !purpose) {
    throw new AppError('Enter what the money was spent on', 400);
  }
  return {
    type: body.type,
    amount: parseAmount(body.amount),
    party_name: partyName,
    purpose: purpose || null,
    entry_date: date,
    method: METHODS.includes(body.method) ? body.method : 'cash',
    notes: parseOptionalText(body.notes) || null,
  };
};

const sumWhere = async (where) => {
  const [incomingRow, outgoingRow] = await Promise.all([
    CashEntry.findOne({
      attributes: [[fn('SUM', col('amount')), 'total']],
      where: { ...where, type: 'incoming' },
      raw: true,
    }),
    CashEntry.findOne({
      attributes: [[fn('SUM', col('amount')), 'total']],
      where: { ...where, type: 'outgoing' },
      raw: true,
    }),
  ]);
  const incoming = toMoney(incomingRow?.total);
  const outgoing = toMoney(outgoingRow?.total);
  return { incoming, outgoing, balance: Number((incoming - outgoing).toFixed(2)) };
};

const listEntries = async (req, res, next) => {
  try {
    const { search, type, from, to } = req.query;
    const { page, limit, offset } = parsePagination({ ...req.query, limit: req.query.limit || 50 });
    const { start, end, today } = istPeriodBounds();
    const where = {};
    if (type === 'incoming' || type === 'outgoing') where.type = type;
    const startDate = from && /^\d{4}-\d{2}-\d{2}$/.test(from) ? from : start;
    const endDate = to && /^\d{4}-\d{2}-\d{2}$/.test(to) ? to : end;
    where.entry_date = { [Op.between]: [startDate, endDate] };
    if (search && String(search).trim()) {
      const q = `%${String(search).trim()}%`;
      where[Op.or] = [
        { party_name: { [Op.like]: q } },
        { purpose: { [Op.like]: q } },
        { notes: { [Op.like]: q } },
      ];
    }

    const { rows, count } = await CashEntry.findAndCountAll({
      where,
      include: [{ model: User, as: 'addedByUser', attributes: ['id', 'name', 'role'] }],
      order: [
        ['entry_date', 'DESC'],
        ['created_at', 'DESC'],
      ],
      limit,
      offset,
    });

    const [rangeTotals, todayTotals, monthTotals] = await Promise.all([
      sumWhere({ entry_date: { [Op.between]: [startDate, endDate] } }),
      sumWhere({ entry_date: today }),
      sumWhere({ entry_date: { [Op.between]: [start, end] } }),
    ]);

    return success(
      res,
      rows.map(mapEntry),
      {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
        totals: {
          incoming: rangeTotals.incoming,
          outgoing: rangeTotals.outgoing,
          balance: rangeTotals.balance,
          todayIncoming: todayTotals.incoming,
          todayOutgoing: todayTotals.outgoing,
          monthIncoming: monthTotals.incoming,
          monthOutgoing: monthTotals.outgoing,
        },
        from: startDate,
        to: endDate,
        today,
      }
    );
  } catch (err) {
    next(err);
  }
};

const createEntry = async (req, res, next) => {
  try {
    const payload = parseBody(req.body);
    payload.added_by = req.user?.id || null;
    const created = await CashEntry.create(payload);
    const row = await CashEntry.findByPk(created.id, {
      include: [{ model: User, as: 'addedByUser', attributes: ['id', 'name', 'role'] }],
    });
    return success(res, mapEntry(row), null, 201);
  } catch (err) {
    next(err);
  }
};

const updateEntry = async (req, res, next) => {
  try {
    const row = await CashEntry.findByPk(req.params.id);
    if (!row) throw new AppError('Cash entry not found', 404);
    const payload = parseBody({ ...row.toJSON(), ...req.body });
    await row.update(payload);
    const fresh = await CashEntry.findByPk(row.id, {
      include: [{ model: User, as: 'addedByUser', attributes: ['id', 'name', 'role'] }],
    });
    return success(res, mapEntry(fresh));
  } catch (err) {
    next(err);
  }
};

const deleteEntry = async (req, res, next) => {
  try {
    const row = await CashEntry.findByPk(req.params.id);
    if (!row) throw new AppError('Cash entry not found', 404);
    await row.destroy();
    return success(res, { deleted: true });
  } catch (err) {
    next(err);
  }
};

module.exports = { listEntries, createEntry, updateEntry, deleteEntry };
