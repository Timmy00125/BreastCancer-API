import pytest
from app.services.prediction import load_ml_model, find_last_conv_layer
import tensorflow as tf

def test_find_last_conv_layer():
    model = tf.keras.models.Sequential([
        tf.keras.layers.Conv2D(32, (3, 3), activation='relu', input_shape=(150, 150, 3)),
        tf.keras.layers.MaxPooling2D(2, 2),
        tf.keras.layers.Flatten(),
        tf.keras.layers.Dense(1, activation='sigmoid')
    ])
    
    layer_name = find_last_conv_layer(model)
    assert layer_name is not None
    assert "conv2d" in layer_name.lower()
