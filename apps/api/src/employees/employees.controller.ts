import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Get('departments')
  getDepartments() {
    return this.employeesService.getDepartments();
  }

  @Post('send-otp')
  sendOtp(@Request() req: any, @Body() body: { email: string }) {
    return this.employeesService.sendEmployeeOtp(req.user.id, body.email);
  }

  @Post('verify-otp')
  verifyOtp(@Request() req: any, @Body() body: { email: string; otp: string }) {
    return this.employeesService.verifyEmployeeOtp(req.user.id, body.email, body.otp);
  }

  @Post()
  create(@Request() req: any, @Body() dto: any) {
    return this.employeesService.createEmployee(req.user.id, dto);
  }

  @Get()
  getAll(@Request() req: any) {
    return this.employeesService.getAllEmployees(req.user.id);
  }

  @Get('my-team')
  getMyTeam(@Request() req: any) {
    return this.employeesService.getMyEmployees(req.user.id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Request() req: any, @Body() dto: any) {
    return this.employeesService.updateEmployee(id, req.user.id, dto);
  }

  @Delete(':id/deactivate')
  deactivate(@Param('id') id: string, @Request() req: any) {
    return this.employeesService.deactivateEmployee(id, req.user.id);
  }
}
