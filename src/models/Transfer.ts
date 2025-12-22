/**
 * Consumer-facing reporesentation of a Transfer.
 */
export interface Transfer {
  transferId: number;
  timestamp: string;
  amount: number;
  toAccountId: number;
  fromAccountId: number;
}

/**
 * A Transfer as it appears in the database.
 */
export interface TransferDTO {
  id: number;
  timestamp: string;
  amount: number;
  toId: number;
  fromId: number;
}
