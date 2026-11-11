import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

@ApiTags("health")
@Controller("health")
export class HealthController {
  @Get()
  @ApiOperation({ summary: "Check API liveness" })
  health() {
    return { status: "ok", service: "basmat-fan-api", timestamp: new Date().toISOString() };
  }
}
