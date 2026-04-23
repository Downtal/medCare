# Summary: 06-01 - Đồng bộ tồn kho thực tế giữa Order và Inventory

**Status:** Complete
**Completed:** 2026-04-22

## Key Files Modified
- `inventory-service/StockDeductRequest.java`: DTO nhận yêu cầu trừ kho.
- `inventory-service/InventoryService.java`: Logic trừ kho FIFO theo ngày hết hạn (Expiry Date), ném ngoại lệ nếu thiếu hàng và ghi log `OUT`.
- `inventory-service/InventoryController.java`: Mở endpoint `/api/inventory/internal/deduct`.
- `order-service/InventoryClient.java`: FeignClient gọi sang inventory-service.
- `order-service/OrderService.java`: Tích hợp logic trừ kho thực tế ngay khi tạo đơn hàng, đảm bảo tính nhất quán của dữ liệu.

## Accomplishments
- Đã thay thế hoàn toàn logic mock tồn kho bằng việc kết nối với database thật của `inventory-service`.
- Đảm bảo hàng hóa được trừ theo thứ tự lô hàng cũ nhất (hết hạn trước) để tối ưu vận hành kho.
- Rollback transaction tạo đơn hàng nếu `inventory-service` báo hết hàng.

## Next Steps
- Hoàn thiện API Tracking và hiển thị Timeline vận chuyển.
