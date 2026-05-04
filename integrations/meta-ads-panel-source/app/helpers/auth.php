<?php

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

function isLoggedIn(): bool
{
    return isset($_SESSION['user']);
}

function requireLogin(): void
{
    if (!isLoggedIn()) {
        header('Location: login.php');
        exit;
    }
}

function loginUser(array $user): void
{
    $_SESSION['user'] = $user;
}

function logoutUser(): void
{
    session_unset();
    session_destroy();
}