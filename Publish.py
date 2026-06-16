import tkinter as tk
from tkinter import messagebox
import subprocess
import datetime
import os

GITIGNORE_RULES = [".env", "configlogs.txt", "logs.txt", "PublishLogs.txt", "*.py"]

class GitManager:
    def __init__(self, root):
        self.root = root
        self.root.title("LibreClaude Git Deployer")
        self.root.geometry("400x500")
        self.root.configure(bg="#121212")
        self.setup_ui()

    def setup_ui(self):
        tk.Label(self.root, text="Target Branch:", bg="#121212", fg="white").pack(pady=(20, 0))
        self.branch_var = tk.StringVar(value="main")
        self.branch_menu = tk.OptionMenu(self.root, self.branch_var, "main", "debug")
        self.branch_menu.config(bg="#252525", fg="white")
        self.branch_menu.pack()

        tk.Label(self.root, text="Version:", bg="#121212", fg="white").pack(pady=(10, 0))
        self.version_entry = tk.Entry(self.root)
        self.version_entry.pack()

        tk.Label(self.root, text="Commit Message:", bg="#121212", fg="white").pack(pady=(10, 0))
        self.commit_entry = tk.Entry(self.root)
        self.commit_entry.pack()

        self.deploy_btn = tk.Button(self.root, text="Deploy to GitHub", command=self.deploy)
        self.deploy_btn.pack(pady=30)

    def log_action(self, message):
        timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        with open("PublishLogs.txt", "a") as f:
            f.write(f"[{timestamp}] {message}\n")

    def check_security_bypass(self):
        gemini_keys = ["GEMINI_API_KEY", "GOOGLE_API_KEY"]
        if os.path.exists(".env"):
            with open(".env", "r") as f:
                content = f.read()
                if any(key in content for key in gemini_keys):
                    if os.path.exists(".env.example"):
                        with open(".env.example", "r") as ex:
                            ex_content = ex.read()
                            if any(key in ex_content for key in gemini_keys):
                                return True
                    return False
        return True

    def run_git(self, args):
        result = subprocess.run(
            ["git"] + args,
            capture_output=True,
            text=True
        )
        if result.returncode != 0:
            error = result.stderr.strip() or result.stdout.strip()
            return False, error
        return True, result.stdout.strip()

    def ensure_branch(self, branch):
        result = subprocess.run(
            ["git", "branch", "--list", branch],
            capture_output=True, text=True
        )
        if branch not in result.stdout:
            ok, err = self.run_git(["checkout", "-b", branch])
            if not ok:
                return False, err
        else:
            ok, err = self.run_git(["checkout", branch])
            if not ok:
                return False, err
        return True, ""

    def fix_gitignore(self):
        """Corrige le .gitignore et purge le cache Git pour les fichiers sensibles."""
        # Réécrire le .gitignore proprement (sans virgules ni espaces)
        with open(".gitignore", "w") as f:
            for rule in GITIGNORE_RULES:
                f.write(rule + "\n")

        # Supprimer du cache Git les fichiers qui ne devraient pas être trackés
        sensitive = [".env", "configlogs.txt", "logs.txt", "PublishLogs.txt"]
        for filepath in sensitive:
            if os.path.exists(filepath):
                # --cached = retire du tracking Git sans supprimer le fichier local
                self.run_git(["rm", "--cached", filepath])

    def deploy(self):
        if not self.check_security_bypass():
            msg = "DEPLOYMENT BLOCKED: Gemini keys detected in .env but missing in .env.example"
            self.log_action(msg)
            messagebox.showerror("Security Error", msg)
            return

        branch = self.branch_var.get()
        version = self.version_entry.get().strip()
        message = self.commit_entry.get().strip()

        if not version or not message:
            messagebox.showwarning("Champs manquants", "Veuillez remplir la version et le message de commit.")
            return

        full_message = f"v{version}: {message}"

        # 1. Corriger le .gitignore et purger le cache
        self.fix_gitignore()

        # 2. S'assurer que la branche existe
        ok, err = self.ensure_branch(branch)
        if not ok:
            self.log_action(f"ERROR branch: {err}")
            messagebox.showerror("Erreur branche", err)
            return

        # 3. git add .
        ok, err = self.run_git(["add", "."])
        if not ok:
            self.log_action(f"ERROR git add: {err}")
            messagebox.showerror("Erreur git add", err)
            return

        # 4. git commit
        ok, err = self.run_git(["commit", "-m", full_message])
        if not ok:
            if "nothing to commit" in err or "nothing added" in err or "no changes added" in err:
                ok, err = self.run_git(["commit", "--allow-empty", "-m", full_message])
                if not ok:
                    self.log_action(f"ERROR git commit (empty): {err}")
                    messagebox.showerror("Erreur git commit", err)
                    return
            else:
                self.log_action(f"ERROR git commit: {err}")
                messagebox.showerror("Erreur git commit", err)
                return

        # 5. Pull avant push
        ok, err = self.run_git(["pull", "--no-rebase", "origin", branch])
        if not ok:
            if "couldn't find remote ref" in err or "no tracking information" in err:
                pass
            else:
                self.log_action(f"ERROR git pull: {err}")
                messagebox.showerror("Erreur git pull", err)
                return

        # 6. git push
        ok, err = self.run_git(["push", "--set-upstream", "origin", branch])
        if not ok:
            self.log_action(f"ERROR git push: {err}")
            messagebox.showerror("Erreur git push", err)
            return

        log_msg = f"SUCCESS: Deployed {full_message} to branch {branch}"
        self.log_action(log_msg)
        messagebox.showinfo("Succès", f"Déployé sur '{branch}' avec succès !")

if __name__ == "__main__":
    root = tk.Tk()
    app = GitManager(root)
    root.mainloop()