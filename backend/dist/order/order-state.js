"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALLOWED_TRANSITIONS = exports.OrderStatus = void 0;
exports.canTransition = canTransition;
exports.assertTransition = assertTransition;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
Object.defineProperty(exports, "OrderStatus", { enumerable: true, get: function () { return client_1.OrderStatus; } });
exports.ALLOWED_TRANSITIONS = {
    [client_1.OrderStatus.PENDING]: [client_1.OrderStatus.PAID, client_1.OrderStatus.PAYMENT_FAILED, client_1.OrderStatus.CANCELLED],
    [client_1.OrderStatus.PAYMENT_FAILED]: [client_1.OrderStatus.PENDING, client_1.OrderStatus.CANCELLED],
    [client_1.OrderStatus.PAID]: [client_1.OrderStatus.PREPARING, client_1.OrderStatus.CANCELLED],
    [client_1.OrderStatus.PREPARING]: [client_1.OrderStatus.READY],
    [client_1.OrderStatus.READY]: [client_1.OrderStatus.COMPLETED],
    [client_1.OrderStatus.COMPLETED]: [],
    [client_1.OrderStatus.CANCELLED]: [],
};
function canTransition(from, to) {
    return exports.ALLOWED_TRANSITIONS[from].includes(to);
}
function assertTransition(from, to) {
    if (!canTransition(from, to)) {
        throw new common_1.BadRequestException(`Không thể chuyển đơn từ ${from} sang ${to}`);
    }
}
//# sourceMappingURL=order-state.js.map