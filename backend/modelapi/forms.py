# # --Login Form--
# class Login_Form(AuthenticationForm):
# #------------------------------------------------------------------------
#     username=forms.CharField(widget=forms.TextInput(attrs={'class':'form-control',  'id': 'user-input', 'autocomplete':'off'}), label='user-input')
#     password= forms.CharField(widget=forms.PasswordInput(
#     attrs={'class':'form-control', 'id': 'password-input','type':'password', 'name': 'password', 'autocomplete':'new-password'}),
#     label='password-input')
#     def clean(self):
#         username = self.cleaned_data.get('username')
#         password = self.cleaned_data.get('password')
#         if ApplicationUser.objects.filter(username=username):
#             self.user_cache = authenticate(username=username,
# 										   password=password)
#         else:
#             self.user_cache=None
#         if self.user_cache is None:
#             raise forms.ValidationError(
# 					self.error_messages['invalid_login'],
# 					code='user not existed',
# 					params={'username': self.username_field.verbose_name},
# 				)
#         # for someone deleted to not an application user 
#         elif get_object_or_404(ApplicationUser, username=username).is_appuser == False:
#             raise forms.ValidationError(
# 					self.error_messages['invalid_login'],
# 					code='user is not appuser',
# 					params={'username': self.username_field.verbose_name},
# 				)

#         return self.cleaned_data


# #=================================================================================================
# # Application User
# #=================================================================================================

# #------------------------------------------------------------------------
# Permission_Choices=[ ("Read","Read"),("Write","Write"),("Delete","Delete"), ("Admin","Admin"), ("No","No")]

# class AppUser_Form(forms.ModelForm):

#     permission=forms.ChoiceField(choices=Permission_Choices)

#     class Meta:
#         model=ApplicationUser
#         fields=['first_name','last_name','email', 'is_active', 'username', 'name', 'initials','permission','is_appuser']

# #----------------------