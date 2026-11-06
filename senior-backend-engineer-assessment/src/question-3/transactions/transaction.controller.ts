import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';
import { CreateTransferCommand } from './transaction.interfaces';
import { TransactionService } from './transaction.service';

@Controller('transactions')
export class TransactionController {
  constructor(private readonly transactions: TransactionService) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  async create(
    @Body() body: Omit<CreateTransferCommand, 'tenantId' | 'investorId'>,
    @Req() request: { tenantContext: { tenantId: string; investorId?: string } },
  ) {
    const context = request.tenantContext;
    if (!context.investorId) {
      throw new Error('Investor context is required');
    }

    const result = await this.transactions.initiate({
      ...body,
      tenantId: context.tenantId,
      investorId: context.investorId,
    });
    return { ...result, message: 'Transaction accepted for asynchronous processing' };
  }
}
