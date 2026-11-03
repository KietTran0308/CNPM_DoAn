"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALLOWED_TRANSITIONS = exports.OrderStatus = void 0;
exports.canTransition = canTransition;
exports.assertTransition = assertTransition;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
Object.defineProperty(exports, "OrderStatus", { enumerable: true, get: function () { return client_1.OrderStatus; } });
exports.ALLOWED_TRANSITIONS = {
    PENDING: ['PAID', 'PAYMENT_FAILED', 'CANCELLED'],
    PAYMENT_FAILED: ['PENDING', 'CANCELLED'],
    PAID: ['PREPARING', 'CANCELLED'],
    PREPARING: ['READY'],
    READY: ['COMPLETED'],
    COMPLETED: [],
    CANCELLED: [],
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