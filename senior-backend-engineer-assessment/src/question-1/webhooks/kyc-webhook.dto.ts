import { IsISO8601, IsIn, IsUUID } from 'class-validator';

export class KycWebhookDto {
  @IsUUID()
  event_id!: string;

  @IsUUID()
  investor_id!: string;

  @IsIn(['approved', 'rejected', 'pending'])
  new_status!: 'approved' | 'rejected' | 'pending';

  @IsISO8601()
  timestamp!: string;
}
