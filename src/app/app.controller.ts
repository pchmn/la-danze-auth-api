import { Controller, Get, Param, Res } from '@nestjs/common';

@Controller()
export class AppController {

  @Get()
  getHello(): string {
    return "Welcome on auth api PROD (via travis ci)";
  }

  @Get('public/:imgName')
  getLogo(@Param('imgName') imgName, @Res() res) {
    res.sendFile(imgName, { root: 'public' });
  }
}
