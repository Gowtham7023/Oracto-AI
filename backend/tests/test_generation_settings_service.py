from app.services.generation_settings_service import generation_settings_service


def test_automatic_settings_simple():
    settings = generation_settings_service.get_generation_settings("simple")
    assert settings["temperature"] == 0.20
    assert settings["max_tokens"] == 128


def test_automatic_settings_moderate():
    settings = generation_settings_service.get_generation_settings("moderate")
    assert settings["temperature"] == 0.20
    assert settings["max_tokens"] == 2048


def test_automatic_settings_complex():
    settings = generation_settings_service.get_generation_settings("complex")
    assert settings["temperature"] == 0.15
    assert settings["max_tokens"] == 4096


def test_resolve_automatic_mode():
    resolved_simple = generation_settings_service.resolve_generation_settings(
        complexity="simple",
        generation_mode="automatic",
        manual_temperature=0.8,
        manual_max_tokens=999,
    )
    assert resolved_simple["mode"] == "automatic"
    assert resolved_simple["temperature"] == 0.20
    assert resolved_simple["max_tokens"] == 128

    resolved_moderate = generation_settings_service.resolve_generation_settings(
        complexity="moderate",
        generation_mode="automatic",
    )
    assert resolved_moderate["mode"] == "automatic"
    assert resolved_moderate["temperature"] == 0.20
    assert resolved_moderate["max_tokens"] == 2048

    resolved_complex = generation_settings_service.resolve_generation_settings(
        complexity="complex",
        generation_mode="automatic",
    )
    assert resolved_complex["mode"] == "automatic"
    assert resolved_complex["temperature"] == 0.15
    assert resolved_complex["max_tokens"] == 4096


def test_resolve_manual_mode():
    resolved = generation_settings_service.resolve_generation_settings(
        complexity="simple",
        generation_mode="manual",
        manual_temperature=0.5,
        manual_max_tokens=1024,
    )
    assert resolved["mode"] == "manual"
    assert resolved["temperature"] == 0.5
    assert resolved["max_tokens"] == 1024
