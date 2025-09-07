"""
Pytest configuration and fixtures for async testing
"""

import asyncio
import pytest
import pytest_asyncio
from typing import Generator


# Configure pytest-asyncio to use function scope for fixtures
def pytest_configure(config):
    """Configure pytest-asyncio settings"""
    config.option.asyncio_default_fixture_loop_scope = "function"


@pytest_asyncio.fixture(scope="function")
def event_loop() -> Generator[asyncio.AbstractEventLoop, None, None]:
    """Create an instance of the default event loop for the test session."""
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    
    yield loop
    
    # Clean up pending tasks
    pending = asyncio.all_tasks(loop)
    for task in pending:
        task.cancel()
    
    # Wait for tasks to be cancelled
    if pending:
        loop.run_until_complete(asyncio.gather(*pending, return_exceptions=True))
    
    # Close the loop
    if not loop.is_closed():
        loop.close()


# Configure pytest-asyncio
pytest_plugins = ('pytest_asyncio',)
