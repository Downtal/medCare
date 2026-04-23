package com.medcare.inventoryservice.entity;

public enum InventoryChangeType {
    IN,      // Nhập kho
    OUT,     // Xuất kho (bán)
    RESERVE, // Giữ chỗ (khi đặt hàng)
    RELEASE, // Giải phóng (khi hủy đơn)
    ADJUST   // Điều chỉnh (kiểm kê)
}
