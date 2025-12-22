import { TransferDTO } from '../../../src/models/Transfer';
import { TransferRepository } from '../../../src/repositories/TransferRepository';

describe('TransferRepository Unit Tests', () => {
  const mockTransferDto1: TransferDTO = {
    id: 1,
    timestamp: 'right now',
    amount: 100,
    toId: 1,
    fromId: 2
  };
  const mockTransferDto2: TransferDTO = {
    id: 2,
    timestamp: 'right now',
    amount: 50,
    toId: 3,
    fromId: 1
  };

  const mockSqliteDb = {
    all: jest.fn(),
    run: jest.fn()
  };
  let transferRepo: TransferRepository;

  beforeAll(() => {
    transferRepo = new TransferRepository(mockSqliteDb as any);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('Can return an empty list if there are no transfers', async () => {
    mockSqliteDb.all.mockResolvedValue([]); // sqlite.all returns an array of entities
    const result = await transferRepo.getTransfersForAccount(1);
    expect(mockSqliteDb.all).toHaveBeenCalledWith('SELECT * FROM transfers WHERE toId = ? OR fromId = ?', 1, 1);
    expect(result.length).toBe(0);
  });

  test('Can return transfers for account', async () => {
    mockSqliteDb.all.mockResolvedValue([mockTransferDto1, mockTransferDto2]); // sqlite.all returns an array of entities
    const result = await transferRepo.getTransfersForAccount(1);
    expect(mockSqliteDb.all).toHaveBeenCalledWith('SELECT * FROM transfers WHERE toId = ? OR fromId = ?', 1, 1);
    expect(result.length).toBe(2);
    expect(result).toEqual([
      {
        id: 1,
        timestamp: 'right now',
        amount: 100,
        toId: 1,
        fromId: 2
      },
      {
        id: 2,
        timestamp: 'right now',
        amount: 50,
        toId: 3,
        fromId: 1
      }
    ]);
  });

  test('Can create a transfer', async () => {
    mockSqliteDb.run.mockResolvedValue({ lastID: 5 }); // see RunResult interface in sqlite
    const result = await transferRepo.createTransfer(100, 1, 2);
    expect(mockSqliteDb.run)
      .toHaveBeenCalledWith('INSERT INTO transfers (timestamp, amount, toId, fromId) VALUES (?, ?, ?, ?)', expect.any(String), 100, 1, 2);
    expect(result).toEqual({
      id: 5,
      timestamp: expect.any(String),
      amount: 100,
      toId: 1,
      fromId: 2
    });
  });
});
