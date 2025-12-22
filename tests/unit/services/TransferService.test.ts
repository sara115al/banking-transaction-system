import { TransferDTO } from '../../../src/models/Transfer';
import { TransferService } from '../../../src/services/TransferService';

describe('TransferService Unit Tests', () => {
  const mockTransferDto: TransferDTO = {
    id: 1,
    timestamp: 'right now',
    amount: 100,
    toId: 1,
    fromId: 2
  };

  const mockTransferRepo = {
    createTransfer: jest.fn(),
    getTransfersForAccount: jest.fn()
  };
  let transferService: TransferService;

  beforeAll(() => {
    transferService = new TransferService(mockTransferRepo as any);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('Can create a transfer', async () => {
    mockTransferRepo.createTransfer.mockResolvedValue(mockTransferDto);
    const result = await transferService.createTransfer(mockTransferDto.amount, mockTransferDto.toId, mockTransferDto.fromId);
    expect(mockTransferRepo.createTransfer).toHaveBeenCalledWith(100, 1, 2);
    expect(result).toEqual({
      transferId: 1,
      amount: 100,
      timestamp: 'right now',
      toAccountId: 1,
      fromAccountId: 2
    });
  });

  test('Can get transfers for an account', async () => {
    mockTransferRepo.getTransfersForAccount.mockResolvedValue([mockTransferDto]);
    const result = await transferService.getTransfersForAccount(mockTransferDto.id);
    expect(mockTransferRepo.getTransfersForAccount).toHaveBeenCalledWith(1);
    expect(result).toEqual([{
      transferId: 1,
      amount: 100,
      timestamp: 'right now',
      toAccountId: 1,
      fromAccountId: 2
    }]);
  });
});
