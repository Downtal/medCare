package com.medcare.authservice.service;

import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class MailService {

    private final JavaMailSender mailSender;

    public void sendOtpEmail(String to, String otp) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject("Mã xác thực khôi phục mật khẩu - MedCare");
        message.setText("Chào bạn,\n\n" +
                "Mã xác thực (OTP) để khôi phục mật khẩu của bạn là: " + otp + "\n" +
                "Mã này sẽ hết hạn sau 5 phút. Vui lòng không chia sẻ mã này với bất kỳ ai.\n\n" +
                "Trân trọng,\n" +
                "Đội ngũ MedCare Health & Pharma");

        mailSender.send(message);
    }

    public void sendRegistrationOtpEmail(String to, String otp) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject("Xác thực tài khoản đăng ký - MedCare");
        message.setText("Chào mừng bạn đến với MedCare,\n\n" +
                "Để hoàn tất việc đăng ký tài khoản, vui lòng nhập mã xác thực (OTP) sau:\n" +
                "Mã xác thực: " + otp + "\n" +
                "Mã này có hiệu lực trong vòng 5 phút.\n\n" +
                "Nếu bạn không thực hiện đăng ký này, vui lòng bỏ qua email này.\n\n" +
                "Trân trọng,\n" +
                "Đội ngũ MedCare Health & Pharma");

        mailSender.send(message);
    }
}
