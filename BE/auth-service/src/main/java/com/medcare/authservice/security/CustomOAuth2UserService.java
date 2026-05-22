package com.medcare.authservice.security;

import com.medcare.authservice.entity.AuthProvider;
import com.medcare.authservice.entity.User;
import com.medcare.authservice.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);

        String registrationId = userRequest.getClientRegistration().getRegistrationId();
        AuthProvider provider = registrationId.equalsIgnoreCase("google") ? AuthProvider.GOOGLE : AuthProvider.FACEBOOK;
        
        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");
        String providerId = oAuth2User.getName(); // Usually sub or id

        // Custom logic to handle user registration or update
        // We'll wrap the OAuth2User in a custom principal if needed, 
        // or just return oAuth2User and handle the token generation in SuccessHandler.
        
        return new CustomOAuth2User(oAuth2User, email, name, provider, providerId);
    }
}
