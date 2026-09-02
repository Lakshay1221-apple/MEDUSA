import { Injectable, Logger } from '@nestjs/common';
import { GithubService } from '../github/github.service';

@Injectable()
export class GithubProcessor {
  private readonly logger = new Logger(GithubProcessor.name);

  constructor(private readonly githubService: GithubService) {}

  async processVerificationJob(userId: string, arcId: string, date: string) {
    this.logger.log(`Processing GitHub verification job for user ${userId} on ${date}`);
    return this.githubService.verifyToday(userId, arcId, date);
  }
}
