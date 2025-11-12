<?php
session_start();
 function generateCodeVerifier() {
        // Generate two UUIDs and concatenate them to form the code_verifier
        $uuid1 = generateGuid();
        $uuid2 = generateGuid();
        return $uuid1 . $uuid2;
    }

    function generateCodeChallenge($codeVerifier) {
        // Hash the code_verifier using SHA-256
        $hashed = hash('sha256', $codeVerifier, true);

        // Convert the hash to a Base64-URL encoded string
        $base64Url = rtrim(strtr(base64_encode($hashed), '+/', '-_'), '=');

        return $base64Url;
    }

function generateGuid() {
    return sprintf(
        '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0, 0xffff), mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0x0fff) | 0x4000,
        mt_rand(0, 0x3fff) | 0x8000,
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
    );
}

// Example usage:
$codeVerifier = generateCodeVerifier();
echo "Code Verifier:" . $codeVerifier;
$_SESSION['code_verifier'] = $codeVerifier;
$codeChallenge = generateCodeChallenge($codeVerifier);
echo "code_challenge:" . $codeChallenge;

$private_key_path = __DIR__ . "/certi2703/0b18eb32-778d-4df0-ab79-c09fb2e2e24e-opf_uae_client_transport.key"; // Ensure this path is correct
$certificate_path = __DIR__ . "/certi2703/open_finance_crt.pem"; // Ensure this path is correct

echo "<h1>Multi Payment Fixed Period Subscription</h1>";

echo "<h2>Step-1: O3 Util: Prepare encrypted PII</h2>";
 $now = time();
 $exp_pii = $now + 600;
 $guid_encrypt_pii = generateGuid();
$curl = curl_init();

curl_setopt_array($curl, array(
  CURLOPT_URL => 'https://rs1.altareq1.sandbox.apihub.openfinance.ae/o3/v1.0/message-encryption',
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_ENCODING => '',
  CURLOPT_MAXREDIRS => 10,
  CURLOPT_TIMEOUT => 0,
  CURLOPT_FOLLOWLOCATION => true,
  CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
  CURLOPT_CUSTOMREQUEST => 'GET',
  CURLOPT_SSLCERT => $certificate_path,
  CURLOPT_SSLKEY => $private_key_path,
  CURLOPT_SSL_VERIFYPEER => false,
  CURLOPT_POSTFIELDS =>'{
    "header": {
        "alg": "PS256",
        "kid": "VK7K1bjMaGj08N2TNa3AHeVtbcS4DQ84_0pIf0XS8lg"
    },
    "body": {
        "aud": "https://auth1.altareq1.sandbox.apihub.openfinance.ae",
        "exp": "'.$exp_pii.'",
        "iss": "https://rp.sandbox.directory.openfinance.ae/openid_relying_party/338343a2-4a9b-482b-bf46-4437d869ddc2",
        "sub": "https://rp.sandbox.directory.openfinance.ae/openid_relying_party/338343a2-4a9b-482b-bf46-4437d869ddc2",
        "jti": "5849bee4-6bab-4d67-82a9-2ad21e4ddf50",
        "iat": "'.$now.'",
        "Initiation": {
            "Creditor": [
                {
                    "CreditorAgent": {
                        "SchemeName": "BICFI",
                        "Identification": "10000109010101",
			"Name": "Mario International",
			 "PostalAddress":
                        [
                            {
                            "AddressType":"Business",
                            "Country": "AE"
                            }
                        ]
                    },
                    "Creditor": {
                        "Name": "Mario International"
                    },
                    "CreditorAccount": {
                        "SchemeName": "AccountNumber",
                        "Identification": "10000109010101",
                        "Name": {
                            "en": "Mario International"
                        }
                    }
                }    
            ]
        },
        "Risk": {
            "DebtorIndicators": {
                "UserName": {
                    "en": "xx"
                } 
            },
            "CreditorIndicators": {
                "AccountType": "Retail",
                "IsCreditorConfirmed": true,
                "IsCreditorPrePopulated": true,
                "TradingName": "xxx"
            }
        }
    },
    "signingKeyPEM": "-----BEGIN PRIVATE KEY-----MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC9PM2NSiPofCJP5SXBoIIwGHHEJTcN5+MK/yP6PWIvTW96lP/3TbDLN72x6KbtknTrvDuMeAxZla9vT6q9dIl3cl3IdVFtv3sN93f+gzkvvJt+lGS/GevoKw2vYkDLXoFwr8Qoo7Ee/m6IV/X02cuHlfdzOJKTytctr2b4AjCL853yGF0IGzE81ALtiyGJJH44vP+Mg36TzeVlUHTnCWgoz01MEgkUFGFOK7c4Fc9vdgeEKMVjA64NFEuJc+Yb57qBRwr9qCgX2ZOrTzihQ7pLvorbKtg4hOFTE90LErat/t8toNqG9wq1imZeCwBACLO8y/TWmgJiDz1GimtQSKnFAgMBAAECggEABU0WfpcUSDhdt0XkJ8UKD3RatF9DzLu/IE2zNiHobxzddlm8jXvwEEC7dJ8ETBmnrA1SYrqo5+hC4C7sZRE0Iw+BgWmJW5q7DiR/v0i6kH0ZWeE7Go3Ml1GAAlIR1T5Vm0wgoZSreKdDosXKCMFd3dgo4nQYpaXh1edUTqR9WJbVf6KpgJY7qyACBgnDFFjwkh8e+mmc37lnXwybd2MdqJXnL3t5l6zX4+6a53oX5bvdb5BBMwofVvY0M9j8xhhzyULOl+xaeGLv0cOzbD9WUBH3lyTVRjOFPGC3QZNJbgAOJhkrG6BAiEh4tthskaUAjMR4kz/2c+EY9uyDJO7iIQKBgQDzTXb+OgKnjmuY4EfzcNNdjchUcGA+TFK1+PB/wtDNhr77D3FeS5rTcJ9OyBufD+jO7baXeSIX7KkLmSQK8u6u7GZWDkevFDE186B+TPaapLmcXBPARWs23P7kv0mCQd63mVHff7LrMaoFC1l480DN7KfX034dU1nnlHG70edNYQKBgQDHHQabEF4X9NxwXC+5+sXDFsHbnbI7xmtH0n0tq8HF/wmx3/xvKSqqdRejb0kQ1Ch0rBATSfyBbDltHt+5GtPronXYU30LEOC06QRkxOTgquZIKCs/0zyQn7tesf2fytLUDqd8wfutDvlYeBbhNJFeatvR30CRztJ1wmJrtnOy5QKBgQDSWslkqBcfcx1IAbFzorq8CheIGdi8RBTGzEJy06bf6343ZnSoCEoGQTsbTBvFfGXWcuQJNmvpr23AX1kwNjVy+2THRnVnw9eAQ/EhAb28mmr36wwQknRN7OhcMZ6GhhjfOCn3SFsSyc+rqNJkpjwDTncXPP2usR/r/wYOUz7eQQKBgDWiDuZz2TSQw1QMsNpivyRWm+9BIgJR5xHYk9lae36OvRjJoaB7sT9q/OwMDN1YmHEc69OWSUq/URSgjVi57j15bE7R5ku1xyFT5tgR5SjTP+ZN06CEkLrQG9NdFFkXdASk0d6cDePGtclrx5Xv5/xLwlxcy3K7CBuqOYKUCcQ1AoGAIsz1iCsTzCQ4WfcL69obOacfOr4btZx1MuZxc2X4aEnOcRKTjQpBW2IGeg4nBkknrehijaC3Pmz4nKqmuAl9Y4iPuWwHdUfwNRi0COSSgp8yx8R8oCpO7yFHPLgjLLk7fOYz5edBaTqXWI3CYbAQ2HuIAvwmyXNHT1z2ZY6MsK8=-----END PRIVATE KEY-----",
    "jwksUrl": "https://keystore.sandbox.directory.openfinance.ae/233bcd1d-4216-4b3c-a362-9e4a9282bba7/application.jwks"
}
',
  CURLOPT_HTTPHEADER => array(
    'content-type: application/json',
    'x-fapi-interaction-id: 71a8820c-79c2-44ba-8570-d60474ab81d2'
  ),
));

$response = curl_exec($curl);

curl_close($curl);
$encryptedPII = $response;
echo $encryptedPII;
echo "<br>";

// Step-2: Send the encrypted PII to the API endpoint
echo "<h2>Step-2: O3 Util: Prepare request object JWT for PAR end-point</h2>";
$future_date = date('Y-m-d', strtotime('+30 days')); // 30 days from now
$tomorrows_date = date('Y-m-d', strtotime('+1 day')); // Tomorrow's date
$exp_jwt = time() + 600;
$nbf_jwt = time();
$guid_jwt = generateGuid();
$curl = curl_init();
$consentId = generateGuid();
$_SESSION['consentId'] = $consentId;

curl_setopt_array($curl, array(
  CURLOPT_URL => 'https://rs1.altareq1.sandbox.apihub.openfinance.ae/o3/v1.0/message-signature',
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_ENCODING => '',
  CURLOPT_MAXREDIRS => 10,
  CURLOPT_TIMEOUT => 0,
  CURLOPT_FOLLOWLOCATION => true,
  CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
  CURLOPT_CUSTOMREQUEST => 'GET',
  CURLOPT_SSLCERT => $certificate_path,
  CURLOPT_SSLKEY => $private_key_path,
  CURLOPT_SSL_VERIFYPEER => false,
  CURLOPT_POSTFIELDS =>'{
    "header": {
        "alg": "PS256",
        "kid": "VK7K1bjMaGj08N2TNa3AHeVtbcS4DQ84_0pIf0XS8lg"
    },
    "body": {
        "aud": "https://auth1.altareq1.sandbox.apihub.openfinance.ae",
        "exp": "'.$exp_jwt.'",
        "iss": "https://rp.sandbox.directory.openfinance.ae/openid_relying_party/338343a2-4a9b-482b-bf46-4437d869ddc2",
        "scope": "payments openid",
        "redirect_uri": "https://testapp.ariticapp.com/mercurypay",
        "client_id": "https://rp.sandbox.directory.openfinance.ae/openid_relying_party/338343a2-4a9b-482b-bf46-4437d869ddc2",
        "nonce": "'.$guid_jwt.'",
        "state": "'.$guid_jwt.'",
        "nbf": "'.$nbf_jwt.'",
        "response_type": "code",
        "code_challenge_method": "S256",
        "code_challenge": "'.$codeChallenge.'",
        "max_age": 3600,
        "authorization_details": [
            {
                "type": "urn:openfinanceuae:service-initiation-consent:v1.2",
                "consent": {
                    "ConsentId": "'.$consentId.'",
                    "IsSingleAuthorization": true,
                    "ExpirationDateTime": "'.$future_date.'T00:00:00.000Z",
                    "ControlParameters": {
                        "IsDelegatedAuthentication": false,
                        "ConsentSchedule": {
                            "MultiPayment": {
                                "MaximumCumulativeNumberOfPayments": 2,
                                "MaximumCumulativeValueOfPayments": {
                                    "Amount": "300.00",
                                    "Currency": "AED"
                                },
                                "PeriodicSchedule": {
                                    "Type": "FixedPeriodicSchedule",
                                    "PeriodType": "Day",
                                    "PeriodStartDate": "'.$tomorrows_date.'",
                                    "Amount": {
                                        "Amount": "400.00",
                                        "Currency": "AED"
                                    }
                                }
                            }
                        }
                    },
                    "PersonalIdentifiableInformation": "'.$encryptedPII.'",
                    "DebtorReference": "TPP=123e4567-e89b-12d3-a456-426614174000,Merchant=ABC-ABCD-TL001-2024,BIC=DEUTDEFFXXX",
                    "PaymentPurposeCode": "ACM",
                    "SponsoredTPPInformation": {
                        "Name": "string",
                        "Identification": "string"
                    }
                },
                "subscription": {
                    "Webhook": {
                        "Url": "http://localhost:4700/mock-event-receiver",
                        "IsActive": false
                    }
                }
            }
        ]
    },
    "signingKeyPEM": "-----BEGIN PRIVATE KEY-----MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC9PM2NSiPofCJP5SXBoIIwGHHEJTcN5+MK/yP6PWIvTW96lP/3TbDLN72x6KbtknTrvDuMeAxZla9vT6q9dIl3cl3IdVFtv3sN93f+gzkvvJt+lGS/GevoKw2vYkDLXoFwr8Qoo7Ee/m6IV/X02cuHlfdzOJKTytctr2b4AjCL853yGF0IGzE81ALtiyGJJH44vP+Mg36TzeVlUHTnCWgoz01MEgkUFGFOK7c4Fc9vdgeEKMVjA64NFEuJc+Yb57qBRwr9qCgX2ZOrTzihQ7pLvorbKtg4hOFTE90LErat/t8toNqG9wq1imZeCwBACLO8y/TWmgJiDz1GimtQSKnFAgMBAAECggEABU0WfpcUSDhdt0XkJ8UKD3RatF9DzLu/IE2zNiHobxzddlm8jXvwEEC7dJ8ETBmnrA1SYrqo5+hC4C7sZRE0Iw+BgWmJW5q7DiR/v0i6kH0ZWeE7Go3Ml1GAAlIR1T5Vm0wgoZSreKdDosXKCMFd3dgo4nQYpaXh1edUTqR9WJbVf6KpgJY7qyACBgnDFFjwkh8e+mmc37lnXwybd2MdqJXnL3t5l6zX4+6a53oX5bvdb5BBMwofVvY0M9j8xhhzyULOl+xaeGLv0cOzbD9WUBH3lyTVRjOFPGC3QZNJbgAOJhkrG6BAiEh4tthskaUAjMR4kz/2c+EY9uyDJO7iIQKBgQDzTXb+OgKnjmuY4EfzcNNdjchUcGA+TFK1+PB/wtDNhr77D3FeS5rTcJ9OyBufD+jO7baXeSIX7KkLmSQK8u6u7GZWDkevFDE186B+TPaapLmcXBPARWs23P7kv0mCQd63mVHff7LrMaoFC1l480DN7KfX034dU1nnlHG70edNYQKBgQDHHQabEF4X9NxwXC+5+sXDFsHbnbI7xmtH0n0tq8HF/wmx3/xvKSqqdRejb0kQ1Ch0rBATSfyBbDltHt+5GtPronXYU30LEOC06QRkxOTgquZIKCs/0zyQn7tesf2fytLUDqd8wfutDvlYeBbhNJFeatvR30CRztJ1wmJrtnOy5QKBgQDSWslkqBcfcx1IAbFzorq8CheIGdi8RBTGzEJy06bf6343ZnSoCEoGQTsbTBvFfGXWcuQJNmvpr23AX1kwNjVy+2THRnVnw9eAQ/EhAb28mmr36wwQknRN7OhcMZ6GhhjfOCn3SFsSyc+rqNJkpjwDTncXPP2usR/r/wYOUz7eQQKBgDWiDuZz2TSQw1QMsNpivyRWm+9BIgJR5xHYk9lae36OvRjJoaB7sT9q/OwMDN1YmHEc69OWSUq/URSgjVi57j15bE7R5ku1xyFT5tgR5SjTP+ZN06CEkLrQG9NdFFkXdASk0d6cDePGtclrx5Xv5/xLwlxcy3K7CBuqOYKUCcQ1AoGAIsz1iCsTzCQ4WfcL69obOacfOr4btZx1MuZxc2X4aEnOcRKTjQpBW2IGeg4nBkknrehijaC3Pmz4nKqmuAl9Y4iPuWwHdUfwNRi0COSSgp8yx8R8oCpO7yFHPLgjLLk7fOYz5edBaTqXWI3CYbAQ2HuIAvwmyXNHT1z2ZY6MsK8=-----END PRIVATE KEY-----"
}',
  CURLOPT_HTTPHEADER => array(
    'content-type: application/json'
  ),
));

$response_jwt_par_endpoint_step_2 = curl_exec($curl);

curl_close($curl);
echo $response_jwt_par_endpoint_step_2;

echo "<br>";

// Step-3: O3 Util: Prepare private key JWT for PAR end-point
echo "<h2>Step-3: O3 Util: Prepare private key JWT for PAR end-point</h2>";
$exp_assert = time() + 600;
        $nbf_assert = time();
        $guid_assert = generateGuid();

$curl = curl_init();

curl_setopt_array($curl, array(
  CURLOPT_URL => 'https://rs1.altareq1.sandbox.apihub.openfinance.ae/o3/v1.0/message-signature',
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_ENCODING => '',
  CURLOPT_MAXREDIRS => 10,
  CURLOPT_TIMEOUT => 0,
  CURLOPT_FOLLOWLOCATION => true,
  CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
  CURLOPT_CUSTOMREQUEST => 'GET',
  CURLOPT_SSLCERT => $certificate_path,
  CURLOPT_SSLKEY => $private_key_path,
  CURLOPT_SSL_VERIFYPEER => false,
  CURLOPT_POSTFIELDS =>'{
    "header": {
        "alg": "PS256",
        "kid": "VK7K1bjMaGj08N2TNa3AHeVtbcS4DQ84_0pIf0XS8lg"
    },
    "body": {
        "aud": "https://auth1.altareq1.sandbox.apihub.openfinance.ae",
        "exp": "'.$exp_assert.'",
        "iss": "https://rp.sandbox.directory.openfinance.ae/openid_relying_party/338343a2-4a9b-482b-bf46-4437d869ddc2",
        "sub": "https://rp.sandbox.directory.openfinance.ae/openid_relying_party/338343a2-4a9b-482b-bf46-4437d869ddc2",
        "jti": "'.$guid_assert.'",
        "iat": "'.$nbf_assert.'"
    },
    "signingKeyPEM": "-----BEGIN PRIVATE KEY-----MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC9PM2NSiPofCJP5SXBoIIwGHHEJTcN5+MK/yP6PWIvTW96lP/3TbDLN72x6KbtknTrvDuMeAxZla9vT6q9dIl3cl3IdVFtv3sN93f+gzkvvJt+lGS/GevoKw2vYkDLXoFwr8Qoo7Ee/m6IV/X02cuHlfdzOJKTytctr2b4AjCL853yGF0IGzE81ALtiyGJJH44vP+Mg36TzeVlUHTnCWgoz01MEgkUFGFOK7c4Fc9vdgeEKMVjA64NFEuJc+Yb57qBRwr9qCgX2ZOrTzihQ7pLvorbKtg4hOFTE90LErat/t8toNqG9wq1imZeCwBACLO8y/TWmgJiDz1GimtQSKnFAgMBAAECggEABU0WfpcUSDhdt0XkJ8UKD3RatF9DzLu/IE2zNiHobxzddlm8jXvwEEC7dJ8ETBmnrA1SYrqo5+hC4C7sZRE0Iw+BgWmJW5q7DiR/v0i6kH0ZWeE7Go3Ml1GAAlIR1T5Vm0wgoZSreKdDosXKCMFd3dgo4nQYpaXh1edUTqR9WJbVf6KpgJY7qyACBgnDFFjwkh8e+mmc37lnXwybd2MdqJXnL3t5l6zX4+6a53oX5bvdb5BBMwofVvY0M9j8xhhzyULOl+xaeGLv0cOzbD9WUBH3lyTVRjOFPGC3QZNJbgAOJhkrG6BAiEh4tthskaUAjMR4kz/2c+EY9uyDJO7iIQKBgQDzTXb+OgKnjmuY4EfzcNNdjchUcGA+TFK1+PB/wtDNhr77D3FeS5rTcJ9OyBufD+jO7baXeSIX7KkLmSQK8u6u7GZWDkevFDE186B+TPaapLmcXBPARWs23P7kv0mCQd63mVHff7LrMaoFC1l480DN7KfX034dU1nnlHG70edNYQKBgQDHHQabEF4X9NxwXC+5+sXDFsHbnbI7xmtH0n0tq8HF/wmx3/xvKSqqdRejb0kQ1Ch0rBATSfyBbDltHt+5GtPronXYU30LEOC06QRkxOTgquZIKCs/0zyQn7tesf2fytLUDqd8wfutDvlYeBbhNJFeatvR30CRztJ1wmJrtnOy5QKBgQDSWslkqBcfcx1IAbFzorq8CheIGdi8RBTGzEJy06bf6343ZnSoCEoGQTsbTBvFfGXWcuQJNmvpr23AX1kwNjVy+2THRnVnw9eAQ/EhAb28mmr36wwQknRN7OhcMZ6GhhjfOCn3SFsSyc+rqNJkpjwDTncXPP2usR/r/wYOUz7eQQKBgDWiDuZz2TSQw1QMsNpivyRWm+9BIgJR5xHYk9lae36OvRjJoaB7sT9q/OwMDN1YmHEc69OWSUq/URSgjVi57j15bE7R5ku1xyFT5tgR5SjTP+ZN06CEkLrQG9NdFFkXdASk0d6cDePGtclrx5Xv5/xLwlxcy3K7CBuqOYKUCcQ1AoGAIsz1iCsTzCQ4WfcL69obOacfOr4btZx1MuZxc2X4aEnOcRKTjQpBW2IGeg4nBkknrehijaC3Pmz4nKqmuAl9Y4iPuWwHdUfwNRi0COSSgp8yx8R8oCpO7yFHPLgjLLk7fOYz5edBaTqXWI3CYbAQ2HuIAvwmyXNHT1z2ZY6MsK8=-----END PRIVATE KEY-----"
}',
  CURLOPT_HTTPHEADER => array(
    'content-type: application/json'
  ),
));

$response_jwt_par_endpoint_step_3 = curl_exec($curl);
$_SESSION['clientAssertionJwt'] = $response_jwt_par_endpoint_step_3 ;
curl_close($curl);
echo $response_jwt_par_endpoint_step_3;

// Step-4: Send the request to the PAR endpoint
echo "<h2>Step-4: Send the request to the PAR endpoint</h2>";
$parData = [
    'client_id' => 'https://rp.sandbox.directory.openfinance.ae/openid_relying_party/338343a2-4a9b-482b-bf46-4437d869ddc2',
    'request' => $response_jwt_par_endpoint_step_2, // Use the signed JWT from Step 2
    'client_assertion_type' => 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
    'client_assertion' => $response_jwt_par_endpoint_step_3 // Use the signed JWT from Step 3
];
$curl = curl_init();

curl_setopt_array($curl, array(
  CURLOPT_URL => 'https://as1.altareq1.sandbox.apihub.openfinance.ae/par',
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_ENCODING => '',
  CURLOPT_MAXREDIRS => 10,
  CURLOPT_TIMEOUT => 0,
  CURLOPT_FOLLOWLOCATION => true,
  CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
  CURLOPT_CUSTOMREQUEST => 'POST',
  CURLOPT_POSTFIELDS => http_build_query($parData),
  CURLOPT_SSLCERT => $certificate_path,
  CURLOPT_SSLKEY => $private_key_path,
  CURLOPT_SSL_VERIFYPEER => false,
  CURLOPT_HTTPHEADER => array(
    'Content-Type: application/x-www-form-urlencoded'
  ),
));

$responseUri = curl_exec($curl);

$requestUri = json_decode($responseUri, true)['request_uri'];

curl_close($curl);
echo $requestUri;


$clientId = urlencode("https://rp.sandbox.directory.openfinance.ae/openid_relying_party/338343a2-4a9b-482b-bf46-4437d869ddc2");
$responseType = "code";
$scope = "payments openid";
// Build the full Auth URL
$authUrl = "https://auth1.altareq1.sandbox.apihub.openfinance.ae/auth?client_id=$clientId&response_type=$responseType&scope=$scope&request_uri=$requestUri";

echo "<br>";
echo "<h2>Step-5: Redirect to the Authorization URL</h2>";  
echo "<a href='$authUrl'>Click here to authorize</a>";
// 🚀 Redirect the user
//header("Location: $authUrl");
exit; // Always exit after a redirect to stop further script execution
