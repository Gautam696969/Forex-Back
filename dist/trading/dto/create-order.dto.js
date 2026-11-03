var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { IsString, IsNumber, IsOptional, IsIn, Min, Max } from 'class-validator';
export class CreateOrderDto {
    symbol;
    type;
    lots;
    targetPrice;
    stopLoss;
    takeProfit;
}
__decorate([
    IsString(),
    __metadata("design:type", String)
], CreateOrderDto.prototype, "symbol", void 0);
__decorate([
    IsString(),
    IsIn(['BUY', 'SELL', 'BUY_LIMIT', 'SELL_LIMIT', 'BUY_STOP', 'SELL_STOP']),
    __metadata("design:type", String)
], CreateOrderDto.prototype, "type", void 0);
__decorate([
    IsNumber(),
    Min(0.01),
    Max(100.0),
    __metadata("design:type", Number)
], CreateOrderDto.prototype, "lots", void 0);
__decorate([
    IsOptional(),
    IsNumber(),
    __metadata("design:type", Number)
], CreateOrderDto.prototype, "targetPrice", void 0);
__decorate([
    IsOptional(),
    IsNumber(),
    __metadata("design:type", Number)
], CreateOrderDto.prototype, "stopLoss", void 0);
__decorate([
    IsOptional(),
    IsNumber(),
    __metadata("design:type", Number)
], CreateOrderDto.prototype, "takeProfit", void 0);
//# sourceMappingURL=create-order.dto.js.map