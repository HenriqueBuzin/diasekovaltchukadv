pipeline {
    agent any

    options {
        disableConcurrentBuilds()
    }

    stages {

        stage('Deploy') {
            steps {
                script {

                    def branch = env.BRANCH_NAME
                    def project = "diasekovaltchuk-adv"

                    echo "🚀 Branch: ${branch}"

                    if (branch == 'main') {
                        sh """
                        set -e

                        cd /root/projects/${project}

                        echo "🔄 Atualizando código..."
                        git fetch origin
                        git reset --hard origin/main
                        git clean -fd

                        echo "🔗 Aplicando .env..."
                        ln -sf /root/envs/${project}.env .env

                        echo "🛑 Derrubando containers antigos..."
                        docker compose --profile prod down || true

                        echo "🐳 Subindo produção..."
                        docker compose --profile prod up -d --build
                        """
                    }

                    else if (branch == 'dev') {
                        sh """
                        set -e

                        cd /root/projects/${project}-dev

                        echo "🔄 Atualizando código..."
                        git fetch origin
                        git reset --hard origin/dev
                        git clean -fd

                        echo "🔗 Aplicando .env..."
                        ln -sf /root/envs/${project}-dev.env .env

                        echo "🛑 Derrubando containers antigos..."
                        docker compose --profile dev down || true

                        echo "🐳 Subindo dev..."
                        docker compose --profile dev up -d --build
                        """
                    }

                    else {
                        echo "⚠️ Branch ignorada: ${branch}"
                    }
                }
            }
        }

    }
}
