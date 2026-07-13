from django.test import TestCase
from django.contrib.auth import get_user_model

User = get_user_model()

class UserModelTests(TestCase):

    def test_create_user_successful(self):
        email = "hosen@gmail.com"
        password = "1234"
        
        user = User.objects.create_user(email=email, password=password)
        
        self.assertEqual(user.email, email)
        self.assertEqual(user.username, email)
        self.assertTrue(user.check_password(password))
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)
        self.assertTrue(user.is_active)
        self.assertEqual(str(user), email)

    def test_create_user_without_email_raises_error(self):
        with self.assertRaises(ValueError) as context:
            User.objects.create_user(email="", password="1234")
        
        self.assertEqual(str(context.exception), "The Email field must be set")

    def test_create_superuser_successful(self):
        email = "admin@gmail.com"
        password = "superuserpassword"
        
        admin_user = User.objects.create_superuser(email=email, password=password)
        
        self.assertEqual(admin_user.email, email)
        self.assertTrue(admin_user.is_staff)
        self.assertTrue(admin_user.is_superuser)
        self.assertTrue(admin_user.is_active)

    def test_create_superuser_without_is_staff_raises_error(self):

        with self.assertRaises(ValueError) as context:
            User.objects.create_superuser(email="admin2@gmail.com", password="1234", is_staff=False)
        self.assertEqual(str(context.exception), "Superuser must have is_staff=True")

    def test_create_superuser_without_is_superuser_raises_error(self):

        with self.assertRaises(ValueError) as context:
            User.objects.create_superuser(email="admin3@gmail.com", password="password", is_superuser=False)
        self.assertEqual(str(context.exception), "Superuser must have is_superuser=True")