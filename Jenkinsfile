pipeline {
    agent any

    stages {

        stage('Deploy') {
            steps {
                script {

                    def branch = sh(
                        script: "git rev-parse --abbrev-ref HEAD",
                        returnStdout: true
                    ).trim()

                    echo "Branch detectada: ${branch}"

                    if (branch == 'main') {
                        sh '''
                        cd /root/diasekovaltchuk
                        git fetch origin
                        git reset --hard origin/main
                        docker compose --profile prod up -d --build
                        '''
                    }

                    else if (branch == 'dev') {
                        sh '''
                        cd /root/diasekovaltchuk-dev
                        git fetch origin
                        git reset --hard origin/dev
                        docker compose --profile dev up -d --build
                        '''
                    }

                    else {
                        echo "Branch não suportada: ${branch}"
                    }
                }
            }
        }

    }
}
