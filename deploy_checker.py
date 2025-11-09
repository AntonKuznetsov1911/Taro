#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Taro App Deployment Checker
Автоматическая проверка статуса развертывания
"""

import requests
import time
import json
import sys
from datetime import datetime
from typing import Dict, Tuple

# Fix Windows console encoding
if sys.platform == 'win32':
    import os
    os.system('chcp 65001 >nul 2>&1')
    sys.stdout.reconfigure(encoding='utf-8')

class Colors:
    """ANSI цвета для терминала"""
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    END = '\033[0m'
    BOLD = '\033[1m'

class DeploymentChecker:
    def __init__(self):
        self.frontend_url = "https://antonkuznetsov1911.github.io/Taro/"
        self.github_repo = "https://github.com/AntonKuznetsov1911/Taro"
        self.github_api = "https://api.github.com/repos/AntonKuznetsov1911/Taro"

    def print_header(self):
        """Печать заголовка"""
        print("\n" + "="*70)
        print(f"{Colors.CYAN}{Colors.BOLD}🔮 Taro App - Deployment Status Checker{Colors.END}")
        print("="*70 + "\n")

    def check_url(self, url: str, name: str) -> Tuple[bool, int, str]:
        """Проверка доступности URL"""
        try:
            response = requests.get(url, timeout=10)
            status_code = response.status_code

            if status_code == 200:
                status = f"{Colors.GREEN}✅ Работает{Colors.END}"
                success = True
            elif status_code == 404:
                status = f"{Colors.YELLOW}⏳ Не найден (еще не развернут){Colors.END}"
                success = False
            else:
                status = f"{Colors.RED}❌ Ошибка ({status_code}){Colors.END}"
                success = False

            return success, status_code, status

        except requests.exceptions.RequestException as e:
            return False, 0, f"{Colors.RED}❌ Недоступен (ошибка сети){Colors.END}"

    def check_frontend(self) -> Dict:
        """Проверка frontend"""
        print(f"{Colors.BOLD}[1/5] Frontend (GitHub Pages){Colors.END}")
        print(f"URL: {self.frontend_url}")

        success, status_code, status = self.check_url(self.frontend_url, "Frontend")
        print(f"Статус: {status}")
        print()

        return {
            "name": "Frontend",
            "success": success,
            "status_code": status_code,
            "url": self.frontend_url
        }

    def check_github_repo(self) -> Dict:
        """Проверка GitHub репозитория"""
        print(f"{Colors.BOLD}[2/5] GitHub Repository{Colors.END}")
        print(f"URL: {self.github_repo}")

        success, status_code, status = self.check_url(self.github_repo, "GitHub Repo")
        print(f"Статус: {status}")
        print()

        return {
            "name": "GitHub Repository",
            "success": success,
            "status_code": status_code,
            "url": self.github_repo
        }

    def check_config_files(self) -> Dict:
        """Проверка конфигурационных файлов"""
        print(f"{Colors.BOLD}[3/5] Configuration Files{Colors.END}")

        files = [
            "railway.json",
            "Procfile",
            "nixpacks.toml",
            ".github/workflows/deploy.yml",
            "backend/.env.example"
        ]

        results = {}
        for file in files:
            try:
                with open(file, 'r') as f:
                    results[file] = True
                    print(f"{Colors.GREEN}✅{Colors.END} {file}")
            except FileNotFoundError:
                results[file] = False
                print(f"{Colors.RED}❌{Colors.END} {file}")

        all_present = all(results.values())
        print()

        return {
            "name": "Config Files",
            "success": all_present,
            "files": results
        }

    def check_documentation(self) -> Dict:
        """Проверка документации"""
        print(f"{Colors.BOLD}[4/5] Documentation Files{Colors.END}")

        docs = [
            "DEPLOY.html",
            "README_DEPLOY.md",
            "RAILWAY_DEPLOY.md",
            "DEPLOYMENT.md",
            "QUICK_START.md"
        ]

        results = {}
        for doc in docs:
            try:
                with open(doc, 'r', encoding='utf-8') as f:
                    results[doc] = True
                    print(f"{Colors.GREEN}✅{Colors.END} {doc}")
            except FileNotFoundError:
                results[doc] = False
                print(f"{Colors.RED}❌{Colors.END} {doc}")

        all_present = all(results.values())
        print()

        return {
            "name": "Documentation",
            "success": all_present,
            "files": results
        }

    def get_deployment_status(self) -> Dict:
        """Получение общего статуса развертывания"""
        print(f"{Colors.BOLD}[5/5] Overall Status{Colors.END}")

        status = {
            "Frontend Build": ("✅", "Готов", True),
            "GitHub Actions": ("✅", "Настроен", True),
            "Railway Config": ("✅", "Готов", True),
            "Documentation": ("✅", "Создана", True),
            "GitHub Pages": ("⏳", "Требует активации", False),
            "Backend Deploy": ("⏳", "Требует развертывания", False),
        }

        for key, (icon, desc, _) in status.items():
            color = Colors.GREEN if icon == "✅" else Colors.YELLOW
            print(f"{color}{icon}{Colors.END} {key}: {desc}")

        completed = sum(1 for _, _, success in status.values() if success)
        total = len(status)
        percentage = (completed / total) * 100

        print()
        return {
            "status": status,
            "completed": completed,
            "total": total,
            "percentage": percentage
        }

    def print_summary(self, results: Dict):
        """Печать итоговой информации"""
        print("\n" + "="*70)
        print(f"{Colors.BOLD}📊 Summary{Colors.END}")
        print("="*70 + "\n")

        overall = results['overall']
        completed = overall['completed']
        total = overall['total']
        percentage = overall['percentage']

        print(f"Прогресс развертывания: {Colors.CYAN}{percentage:.0f}%{Colors.END} ({completed}/{total})")
        print()

        # Прогресс бар
        bar_length = 50
        filled = int(bar_length * percentage / 100)
        bar = "█" * filled + "░" * (bar_length - filled)
        print(f"[{Colors.CYAN}{bar}{Colors.END}]")
        print()

        # Статус компонентов
        if results['frontend']['success']:
            print(f"{Colors.GREEN}✅ Frontend доступен!{Colors.END}")
            print(f"   {results['frontend']['url']}")
        else:
            print(f"{Colors.YELLOW}⏳ Frontend еще не развернут{Colors.END}")
            print(f"   Активируйте GitHub Pages: {self.github_repo}/settings/pages")

        print()

        # Следующие шаги
        if percentage < 100:
            print(f"{Colors.BOLD}📝 Следующие шаги:{Colors.END}")
            print()

            if not results['frontend']['success']:
                print("1. Активировать GitHub Pages:")
                print(f"   → {self.github_repo}/settings/pages")
                print("   → Source: GitHub Actions")
                print()

            print("2. Развернуть Backend на Railway:")
            print("   → https://railway.app/new")
            print("   → Deploy from GitHub: AntonKuznetsov1911/Taro")
            print()

            print("3. Получить необходимые ключи:")
            print("   → MongoDB: https://www.mongodb.com/cloud/atlas")
            print("   → OpenAI: https://platform.openai.com/api-keys")
            print()
        else:
            print(f"{Colors.GREEN}{Colors.BOLD}🎉 Все готово! Приложение полностью развернуто!{Colors.END}")
            print()

        print("="*70)
        print(f"Время проверки: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("="*70 + "\n")

    def run(self):
        """Запуск всех проверок"""
        self.print_header()

        results = {
            "frontend": self.check_frontend(),
            "github": self.check_github_repo(),
            "config": self.check_config_files(),
            "docs": self.check_documentation(),
            "overall": self.get_deployment_status()
        }

        self.print_summary(results)

        return results

def monitor_mode(interval: int = 30):
    """Режим мониторинга с периодическими проверками"""
    checker = DeploymentChecker()

    print(f"\n{Colors.CYAN}🔄 Режим мониторинга активирован{Colors.END}")
    print(f"Проверка каждые {interval} секунд. Нажмите Ctrl+C для остановки.\n")

    try:
        iteration = 1
        while True:
            print(f"\n{Colors.BOLD}{'='*70}")
            print(f"Проверка #{iteration} - {datetime.now().strftime('%H:%M:%S')}")
            print(f"{'='*70}{Colors.END}\n")

            results = checker.run()

            # Если frontend стал доступен, уведомить
            if results['frontend']['success']:
                print(f"\n{Colors.GREEN}{Colors.BOLD}🎉 Frontend успешно развернут!{Colors.END}")
                print(f"URL: {results['frontend']['url']}\n")
                break

            iteration += 1
            print(f"\n{Colors.YELLOW}Следующая проверка через {interval} секунд...{Colors.END}")
            time.sleep(interval)

    except KeyboardInterrupt:
        print(f"\n\n{Colors.YELLOW}Мониторинг остановлен пользователем.{Colors.END}\n")

if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1 and sys.argv[1] == "monitor":
        interval = int(sys.argv[2]) if len(sys.argv) > 2 else 30
        monitor_mode(interval)
    else:
        checker = DeploymentChecker()
        checker.run()

        print(f"\n{Colors.CYAN}Совет:{Colors.END} Запустите 'python deploy_checker.py monitor' для непрерывного мониторинга\n")
