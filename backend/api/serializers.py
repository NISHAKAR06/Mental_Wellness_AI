from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserProfile, Agent, VoiceSession, SafetyAlert

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['language', 'dark_mode', 'notifications', 'consent_store_transcripts']

class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'profile']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        profile_data = validated_data.pop('profile')
        user = User.objects.create_user(**validated_data)
        UserProfile.objects.create(user=user, **profile_data)
        return user

    def update(self, instance, validated_data):
        profile_data = validated_data.pop('profile')
        profile = instance.profile

        instance.username = validated_data.get('username', instance.username)
        instance.email = validated_data.get('email', instance.email)
        instance.first_name = validated_data.get('first_name', instance.first_name)
        instance.last_name = validated_data.get('last_name', instance.last_name)
        instance.save()

        profile.language = profile_data.get('language', profile.language)
        profile.dark_mode = profile_data.get('dark_mode', profile.dark_mode)
        profile.notifications = profile_data.get('notifications', profile.notifications)
        profile.consent_store_transcripts = profile_data.get('consent_store_transcripts', profile.consent_store_transcripts)
        profile.save()

        return instance

class RegisterSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer()

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'profile']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        profile_data = validated_data.pop('profile')
        user = User.objects.create_user(**validated_data)
        UserProfile.objects.create(user=user, **profile_data)
        return user

class AgentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Agent
        fields = ['agent_id', 'name', 'domain', 'languages', 'description', 'voice_prefs']

class VoiceSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = VoiceSession
        fields = ['session_id', 'agent', 'lang', 'consented_store', 'started_at', 'ended_at', 'duration_sec', 'risk_level']
        read_only_fields = ['session_id', 'started_at', 'ended_at', 'duration_sec', 'risk_level']

class SafetyAlertSerializer(serializers.ModelSerializer):
    class Meta:
        model = SafetyAlert
        fields = ['user', 'session', 'risk_level', 'summary', 'created_at', 'acknowledged']
        read_only_fields = ['created_at']
