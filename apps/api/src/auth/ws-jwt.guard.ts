import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Observable } from 'rxjs';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    try {
      const client = context.switchToWs().getClient();
      const authToken =
        client.handshake?.auth?.token ||
        client.handshake?.headers?.authorization?.split(' ')[1];

      if (!authToken) return false;

      const payload = this.jwtService.verify(authToken);
      context.switchToWs().getData().user = payload;
      return true;
    } catch (err) {
      throw new WsException('Unauthorized');
    }
  }
}
