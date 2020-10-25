import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  constructor() { }

  @Get()
  getHello(): string {
    return "Welcome on auth api (via travis ci)";
  }

  @Get('/test')
  getTest(): string {
    return "Test route";
  }
}
